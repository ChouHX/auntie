import assert from "node:assert/strict"
import test from "node:test"

import type { CmsContent, CmsPaymentOrder, CmsSalesMember } from "@/types/cms"
import type { WecomCustomer } from "@/lib/wecom-types"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const dashboardModule = await import("./sales-user-dashboard.ts")
const { createSalesUserDashboard } = dashboardModule

const members: CmsSalesMember[] = [
  {
    accountUsername: "alice",
    commissionPercentage: 5,
    createdAt: "",
    id: "sales-a",
    name: "Alice",
    status: "active",
    studentTag: "A区",
    updatedAt: "",
  },
  {
    accountUsername: "bob",
    commissionPercentage: 5,
    createdAt: "",
    id: "sales-b",
    name: "Bob",
    status: "active",
    studentTag: "B区",
    updatedAt: "",
  },
]

const customers = [
  customer("a-1", "A区", "2026-08-19T02:00:00.000Z"),
  customer("a-2", "A区", "2026-08-17T02:00:00.000Z"),
  customer("a-3", "A区", "2026-08-01T02:00:00.000Z"),
  customer("a-4", "A区", "2026-07-20T02:00:00.000Z"),
  customer("b-1", "B区", "2026-08-19T02:00:00.000Z"),
]
const orders = [
  order(
    "a-aug",
    "sales-a",
    "Alice",
    "2026-08-10T02:00:00.000Z",
    100,
    30,
    "USD",
    7
  ),
  order(
    "a-jul",
    "sales-a",
    "Alice",
    "2026-07-10T02:00:00.000Z",
    80,
    10,
    "USD",
    7
  ),
  order("b-1", "sales-b", "Bob", "2026-08-11T02:00:00.000Z", 300, 20, "CNY", 1),
  order("b-2", "sales-b", "Bob", "2026-08-12T02:00:00.000Z", 250, 20, "CNY", 1),
]
const content = { paymentOrders: orders, salesMembers: members } as CmsContent

test("销售个人指标只统计本人归属客户与订单", () => {
  const result = createSalesUserDashboard(
    content,
    customers,
    members[0],
    new Date("2026-08-19T04:00:00.000Z")
  )

  assert.deepEqual(result.customerCounts, {
    month: 3,
    today: 1,
    total: 4,
    week: 2,
  })
  assert.deepEqual(result.monthlyProfit, [{ amount: 30, currency: "USD" }])
  assert.deepEqual(result.orderProfitTotal, [{ amount: 40, currency: "USD" }])
})

test("本月团队榜单分别按成交单量与折算成交金额排序", () => {
  const result = createSalesUserDashboard(
    content,
    customers,
    members[0],
    new Date("2026-08-19T04:00:00.000Z")
  )

  assert.equal(result.orderCountRanking[0].salesName, "Bob")
  assert.equal(result.orderCountRanking[0].orderCount, 2)
  assert.equal(result.orderRevenueRanking[0].salesName, "Alice")
  assert.equal(result.orderRevenueRanking[0].amountCny, 700)
})

function customer(relationId: string, studentType: string, addTime: string) {
  return { addTime, relationId, studentType } as WecomCustomer
}

function order(
  orderId: string,
  salesMemberId: string,
  salesOwner: string,
  paidAt: string,
  receivedAmount: number,
  orderProfit: number,
  currency: string,
  profitExchangeRateToCny: number
) {
  return {
    amountValue: receivedAmount,
    createdAt: paidAt,
    serviceDate: paidAt.slice(0, 10),
    currency,
    orderId,
    orderProfit,
    paidAt,
    profitExchangeRateToCny,
    receivedAmount,
    salesMemberId,
    salesOwner,
    status: "paid",
    updatedAt: paidAt,
  } as CmsPaymentOrder
}

test("选择历史月份会更新月客户数、利润及排行，保留累计统计", () => {
  const result = createSalesUserDashboard(
    content,
    customers,
    members[0],
    new Date("2026-08-19T04:00:00Z"),
    "2026-07"
  )
  assert.equal(result.month, "2026-07")
  assert.equal(result.customerCounts.month, 1)
  assert.deepEqual(result.monthlyProfit, [{ amount: 10, currency: "USD" }])
  assert.deepEqual(result.orderProfitTotal, [{ amount: 40, currency: "USD" }])
  assert.equal(result.orderCountRanking[0].salesMemberId, "sales-a")
  assert.equal(result.orderCountRanking[0].orderCount, 1)
})

test("Dashboard 月统计按服务日期，不按生成或付款日期", () => {
  const deferred = {
    ...orders[0],
    createdAt: "2026-07-31T16:00:00Z",
    paidAt: "2026-08-07T00:00:00Z",
    serviceDate: "2026-09-07",
  }
  const fixture = { ...content, paymentOrders: [deferred] }
  const august = createSalesUserDashboard(
    fixture,
    [],
    members[0],
    new Date("2026-10-01T00:00:00Z"),
    "2026-08"
  )
  assert.deepEqual(august.monthlyProfit, [])
  assert.equal(august.orderCountRanking[0].orderCount, 0)
  const september = createSalesUserDashboard(
    fixture,
    [],
    members[0],
    new Date("2026-10-01T00:00:00Z"),
    "2026-09"
  )
  assert.deepEqual(september.monthlyProfit, [{ amount: 30, currency: "USD" }])
  assert.equal(september.orderCountRanking[0].orderCount, 1)
})
