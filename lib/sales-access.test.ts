import assert from "node:assert/strict"
import test from "node:test"

import type { CmsPaymentOrder, CmsSalesMember } from "@/types/cms"
import type { WecomCustomer } from "@/lib/wecom-types"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const customerModule = await import("./sales-customers.ts")
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const orderModule = await import("./sales-orders.ts")
const { createSalesCustomerPage } = customerModule
const { createSalesOrderPage } = orderModule

const alice = member("alice", "Alice", "A区")
const sameName = member("alice-2", "Alice", "B区")

test("销售客户接口只返回当前销售标签归属的客户", () => {
  const result = createSalesCustomerPage(
    [customer("a", "A区"), customer("b", "B区")],
    [alice, sameName],
    alice,
    { page: 1, pageSize: 10, query: "" }
  )

  assert.equal(result.pagination.totalCount, 1)
  assert.equal(result.customers[0].relationId, "a")
  assert.equal("auntie" in result.customers[0], false)
  assert.equal("remarkMobiles" in result.customers[0], false)
})

test("订单存在销售 ID 时不因销售同名泄露给其他账号", () => {
  const assignedToOther = order("order-other", sameName.id, "Alice")
  const legacyOwned = order("order-legacy", "", "Alice")
  const result = createSalesOrderPage([assignedToOther, legacyOwned], alice, {
    page: 1,
    pageSize: 10,
    query: "",
  })

  assert.deepEqual(
    result.orders.map((item) => item.orderId),
    ["order-legacy"]
  )
  assert.equal(result.orders[0].salesCommission, 12.5)
})

function member(id: string, name: string, studentTag: string) {
  return {
    commissionPercentage: 0,
    createdAt: "",
    id,
    name,
    status: "active",
    studentTag,
    updatedAt: "",
  } as CmsSalesMember
}

function customer(relationId: string, studentType: string) {
  return {
    addTime: "2026-08-19T00:00:00.000Z",
    relationId,
    studentType,
  } as WecomCustomer
}

function order(orderId: string, salesMemberId: string, salesOwner: string) {
  return {
    amountValue: 100,
    createdAt: "2026-08-19T00:00:00.000Z",
    currency: "USD",
    orderId,
    salesMemberId,
    salesCommission: 12.5,
    salesOwner,
    status: "paid",
  } as CmsPaymentOrder
}

test("月份筛选按北京时间包含月末，按所有页及币种汇总，排除其他销售", () => {
  const orders = Array.from({ length: 12 }, (_, index) => ({
    ...order(`a-${index}`, alice.id, alice.name),
    createdAt: "2026-08-31T15:59:59Z",
  }))
  const result = createSalesOrderPage(
    [
      ...orders,
      {
        ...order("next-month", alice.id, alice.name),
        createdAt: "2026-08-31T16:00:00Z",
      },
      order("other", sameName.id, sameName.name),
      { ...orders[0], orderId: "cny", currency: "CNY" },
    ],
    alice,
    {
      page: 1,
      pageSize: 10,
      query: "",
      month: "2026-08",
    }
  )
  assert.equal(result.orders.length, 10)
  assert.equal(result.pagination.totalCount, 13)
  assert.deepEqual(result.totals, [
    { currency: "USD", amount: 1200, commission: 150 },
    { currency: "CNY", amount: 100, commission: 12.5 },
  ])
})

test("生成月份可与搜索叠加，不使用预约月份", () => {
  const orders = [
    { ...order("booking", alice.id, alice.name), serviceDate: "2026-09-07" },
  ]
  const options = {
    page: 1,
    pageSize: 10,
    query: "booking",
    month: "2026-08",
  }
  assert.equal(
    createSalesOrderPage(orders, alice, options).pagination.totalCount,
    1
  )
  assert.equal(
    createSalesOrderPage(orders, alice, { ...options, month: "2026-09" })
      .pagination.totalCount,
    0
  )
  assert.equal(
    createSalesOrderPage(orders, alice, { ...options, month: "" }).pagination
      .totalCount,
    1
  )
  assert.deepEqual(
    createSalesOrderPage(orders, alice, { ...options, query: "missing" })
      .totals,
    []
  )
})

test("月份选项基于本人全部订单，不受搜索、月份筛选或分页影响", () => {
  const items = [
    {
      ...order("owned", alice.id, alice.name),
      createdAt: "2025-12-01T00:00:00Z",
    },
    {
      ...order("other", sameName.id, sameName.name),
      createdAt: "2024-01-01T00:00:00Z",
    },
  ]
  const result = createSalesOrderPage(items, alice, {
    page: 1,
    pageSize: 10,
    query: "missing",
    month: "2026-02",
  })
  assert.equal(result.orders.length, 0)
  assert.equal(result.months.at(-1), "2025-12")
  assert.ok(result.months.includes("2026-02"))
  assert.equal(result.months.includes("2024-01"), false)
})
