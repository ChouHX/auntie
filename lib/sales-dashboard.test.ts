import assert from "node:assert/strict"
import test from "node:test"

import type { CmsContent, CmsPaymentOrder } from "@/types/cms"
import type { WecomCustomer } from "@/lib/wecom-types"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const dashboard = await import("./sales-dashboard.ts")
const { createSalesDashboardResult } = dashboard

const now = "2026-08-03T08:00:00.000Z"
const customer: WecomCustomer = {
  addTime: now,
  addWay: "search",
  auntie: "王阿姨",
  avatar: "",
  corpName: "",
  description: "",
  externalUserId: "external-1",
  followUser: "客服陈",
  followUserId: "member-1",
  gender: "female",
  nameAndType: "李女士@微信用户",
  position: "",
  region: "Los Angeles",
  relationId: "relation-1",
  remarkCorpName: "",
  remarkMobiles: "1234567890",
  studentType: "学员 A",
  syncedAt: now,
}

function order(patch: Partial<CmsPaymentOrder>): CmsPaymentOrder {
  return {
    amount: "100",
    amountValue: 100,
    contact: "1234567890",
    createdAt: now,
    currency: "USD",
    customerName: "李女士",
    note: "",
    orderId: "ORD1",
    serviceAddress: "address",
    serviceArea: "Los Angeles · United States",
    serviceDate: "2026-08-04",
    serviceType: "日常清洁",
    status: "paid",
    updatedAt: now,
    ...patch,
  }
}

test("joins customers, filters rows and keeps currency summaries separate", () => {
  const content = {
    formulaTemplates: [],
    paymentOrders: [
      order({
        customerRelationId: customer.relationId,
        dealStatus: "converted",
        orderProfit: 20,
        receivedAmount: 100,
        salesOwner: "旧销售",
      }),
      order({
        amountValue: 80,
        currency: "CAD",
        customerName: "张女士",
        orderId: "ORD2",
        orderProfit: 10,
        receivedAmount: 80,
        salesOwner: "学员 B",
      }),
    ],
    salesMembers: [
      {
        commissionPercentage: 5,
        createdAt: now,
        id: "sales-a",
        name: "学员 A",
        status: "active",
        studentTag: "学员 A",
        updatedAt: now,
      },
    ],
    teamMembers: [],
  } as unknown as CmsContent
  const result = createSalesDashboardResult(content, [customer], {
    filters: [
      { field: "salesOwner", id: "1", operator: "eq", value: "学员 A" },
    ],
    logic: "all",
    page: 1,
    pageSize: 20,
  })
  assert.equal(result.rows.length, 1)
  assert.equal(result.customerCount, 1)
  assert.equal(result.rows[0].customerRelationId, customer.relationId)
  assert.equal(result.rows[0].salesOwner, "学员 A")
  assert.deepEqual(
    result.currencySummaries.map((item: { currency: string }) => item.currency),
    ["USD"]
  )

  const all = createSalesDashboardResult(content, [customer], {
    filters: [],
    logic: "all",
    page: 1,
    pageSize: 20,
  })
  assert.equal(all.currencySummaries.length, 2)
  assert.equal(all.customerCount, 2)

  const unlinkedCustomer = {
    ...customer,
    externalUserId: "external-2",
    nameAndType: "王女士@微信用户",
    relationId: "relation-2",
  }
  const ordersOnly = createSalesDashboardResult(
    content,
    [customer, unlinkedCustomer],
    {
      filters: [],
      logic: "all",
      ordersOnly: true,
      page: 1,
      pageSize: 20,
    }
  )
  assert.equal(ordersOnly.rows.length, 2)
  assert.ok(ordersOnly.rows.every((row: { orderId: string }) => row.orderId))
})

test("does not treat the WeCom follow user as a sales owner", () => {
  const content = {
    formulaTemplates: [],
    paymentOrders: [],
    teamMembers: [],
  } as unknown as CmsContent
  const result = createSalesDashboardResult(
    content,
    [{ ...customer, studentType: "" }],
    { filters: [], logic: "all", page: 1, pageSize: 20 }
  )

  assert.equal(result.rows[0].salesOwner, "")
})

test("ignores legacy automatic follow-user attribution when a bound customer has no student tag", () => {
  const content = {
    formulaTemplates: [],
    paymentOrders: [
      order({
        customerRelationId: customer.relationId,
        salesOwner: customer.followUser,
        salesOwnerSource: "wecom_member",
      }),
    ],
    teamMembers: [],
  } as unknown as CmsContent
  const result = createSalesDashboardResult(
    content,
    [{ ...customer, studentType: "" }],
    { filters: [], logic: "all", page: 1, pageSize: 20 }
  )

  assert.equal(result.rows[0].salesOwner, "")
})

test("未付款订单不会因旧成交字段计入成交统计", () => {
  const content = {
    formulaTemplates: [],
    paymentOrders: [
      order({
        dealStatus: "converted",
        salesOwner: "学员 A",
        status: "unpaid",
      }),
    ],
    salesMembers: [],
    teamMembers: [],
  } as unknown as CmsContent
  const result = createSalesDashboardResult(content, [], {
    filters: [],
    logic: "all",
    page: 1,
    pageSize: 20,
  })

  assert.equal(result.convertedCustomerCount, 0)
  assert.equal(result.salesRanking.length, 0)
})

test("公司账户订单使用实收金额补全订单金额", () => {
  const content = {
    formulaTemplates: [],
    paymentOrders: [
      order({
        amountValue: 0,
        provider: "offline",
        receivedAmount: 148,
      }),
    ],
    salesMembers: [],
    teamMembers: [],
  } as unknown as CmsContent
  const result = createSalesDashboardResult(content, [], {
    filters: [],
    logic: "all",
    page: 1,
    pageSize: 20,
  })

  assert.equal(result.rows[0].paymentAmount, 148)
})
