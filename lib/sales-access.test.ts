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
