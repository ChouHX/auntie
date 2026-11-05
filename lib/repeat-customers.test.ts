import assert from "node:assert/strict"
import test from "node:test"

import type { CmsPaymentOrder } from "@/types/cms"
import type { WecomCustomer } from "@/lib/wecom-types"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const repeat = await import("./repeat-customers.ts")

function order(patch: Partial<CmsPaymentOrder>): CmsPaymentOrder {
  return {
    amount: "100",
    amountValue: 100,
    contact: "1234567890",
    createdAt: "2026-01-01T00:00:00.000Z",
    currency: "USD",
    customerName: "李女士",
    note: "",
    orderId: "ORD1",
    serviceAddress: "地址",
    serviceArea: "洛杉矶 · 美国",
    serviceDate: "2026-01-05",
    serviceType: "日常清洁",
    status: "paid",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  }
}

function customer(relationId: string): WecomCustomer {
  return {
    addTime: "2026-01-01T00:00:00.000Z",
    avatar: `https://example.com/${relationId}.png`,
    nameAndType: `客户${relationId}@微信用户`,
    relationId,
  } as WecomCustomer
}

test("只有 2 次及以上有效订单的客户才算复购用户", () => {
  const rows = repeat.createRepeatCustomers(
    [
      order({ customerRelationId: "A", orderId: "A1" }),
      order({
        createdAt: "2026-01-11T00:00:00.000Z",
        customerRelationId: "A",
        orderId: "A2",
      }),
      order({ customerRelationId: "B", orderId: "B1" }),
      order({ customerRelationId: "C", orderId: "C1" }),
      order({ customerRelationId: "C", orderId: "C2", status: "cancelled" }),
      order({ orderId: "NO-CUSTOMER" }),
    ],
    [customer("A"), customer("B"), customer("C")]
  )

  assert.deepEqual(
    rows.map((row) => row.customerRelationId),
    ["A"]
  )
  assert.equal(rows[0].repeatCount, 1)
  assert.equal(rows[0].totalOrders, 2)
  assert.equal(rows[0].customerName, "客户A")
  assert.equal(rows[0].customerAvatar, "https://example.com/A.png")
})

test("平均间隔时间按相邻订单创建时间计算", () => {
  const rows = repeat.createRepeatCustomers(
    [
      order({ createdAt: "2026-01-01T00:00:00.000Z", customerRelationId: "A" }),
      order({ createdAt: "2026-01-11T00:00:00.000Z", customerRelationId: "A" }),
      order({ createdAt: "2026-01-21T00:00:00.000Z", customerRelationId: "A" }),
    ],
    [customer("A")]
  )

  // (10 + 10) / 2 = 10 天
  assert.equal(rows[0].averageIntervalDays, 10)
  assert.equal(rows[0].repeatCount, 2)
})

test("平均订单金额取订单数最多的币种", () => {
  const rows = repeat.createRepeatCustomers(
    [
      order({ amountValue: 100, currency: "USD", customerRelationId: "A" }),
      order({ amountValue: 200, currency: "USD", customerRelationId: "A" }),
      order({ amountValue: 999, currency: "CAD", customerRelationId: "A" }),
    ],
    [customer("A")]
  )

  assert.equal(rows[0].currency, "USD")
  assert.equal(rows[0].averageOrderAmount, 150)
})

test("订单明细按创建时间倒序、只含该客户并带间隔与阿姨名称", () => {
  const details = repeat.createCustomerOrderDetails(
    [
      order({
        assignedAuntieId: "auntie-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        customerRelationId: "A",
      }),
      order({ createdAt: "2026-02-01T00:00:00.000Z", customerRelationId: "A" }),
      order({ customerRelationId: "B", orderId: "B1" }),
      order({ customerRelationId: "A", orderId: "A3", status: "cancelled" }),
    ],
    "A",
    { "auntie-1": "王阿姨" }
  )

  assert.equal(details.length, 2)
  assert.equal(details[0].orderId, "ORD1")
  assert.equal(details[0].intervalDays, 31)
  assert.equal(details[1].auntieName, "王阿姨")
  assert.equal(details[1].intervalDays, null)
})
