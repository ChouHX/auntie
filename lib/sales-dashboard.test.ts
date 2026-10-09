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

test("sorts linked customer orders by order creation time", () => {
  const olderCustomer = {
    ...customer,
    addTime: "2025-01-01T00:00:00.000Z",
  }
  const content = {
    formulaTemplates: [],
    paymentOrders: [
      order({
        createdAt: "2026-08-20T08:00:00.000Z",
        customerRelationId: olderCustomer.relationId,
        orderId: "NEW-ORDER",
      }),
      order({
        createdAt: "2026-08-10T08:00:00.000Z",
        customerName: "另一位客户",
        orderId: "OLD-ORDER",
      }),
    ],
    salesMembers: [],
    teamMembers: [],
  } as unknown as CmsContent

  const result = createSalesDashboardResult(content, [olderCustomer], {
    filters: [],
    logic: "all",
    ordersOnly: true,
    page: 1,
    pageSize: 20,
  })

  assert.deepEqual(
    result.rows.map((row: { orderId: string }) => row.orderId),
    ["NEW-ORDER", "OLD-ORDER"]
  )
  assert.equal(result.rows[0].addTime, "2026-08-20T08:00:00.000Z")
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

test("订单来源在分页和任意条件筛选前隔离，微信同步缺失不改变来源", () => {
  const content = {
    formulaTemplates: [],
    paymentOrders: [
      ...Array.from({ length: 12 }, (_, index) =>
        order({
          orderId: `SUPPORT-${index}`,
          customerRelationId: customer.relationId,
        })
      ),
      order({
        orderId: "MISSING-CUSTOMER",
        customerRelationId: "removed-relation",
      }),
      order({
        orderId: "SELF-SERVICE",
        salesOwner: "客服陈",
        contact: "微信号",
      }),
      order({ orderId: "WHITESPACE", customerRelationId: "  " }),
    ],
    salesMembers: [],
    teamMembers: [],
  } as unknown as CmsContent
  const query = {
    filters: [
      {
        field: "customerName" as const,
        id: "name",
        operator: "eq" as const,
        value: "李女士",
      },
      {
        field: "orderId" as const,
        id: "id",
        operator: "eq" as const,
        value: "SELF-SERVICE",
      },
    ],
    logic: "any" as const,
    ordersOnly: true,
    page: 2,
    pageSize: 10,
  }
  const support = createSalesDashboardResult(
    content,
    [customer, { ...customer, relationId: "no-orders" }],
    {
      ...query,
      orderSource: "support",
    }
  )
  assert.equal(support.pagination.totalCount, 13)
  assert.equal(support.rows.length, 3)
  assert.ok(support.rows.every((row) => row.customerRelationId))
  assert.equal(support.currencySummaries[0].convertedAmount, 1300)
  assert.deepEqual(support.filterOptions.followUsers, ["客服陈"])

  const selfService = createSalesDashboardResult(content, [customer], {
    ...query,
    orderSource: "self_service",
  })
  assert.equal(selfService.pagination.page, 1)
  assert.deepEqual(
    selfService.rows.map((row) => row.orderId),
    ["SELF-SERVICE", "WHITESPACE"]
  )
  assert.ok(selfService.rows.every((row) => !row.followUser))
  assert.deepEqual(selfService.filterOptions.followUsers, [])
})

test("对接客服来自订单绑定的微信跟进关系，可筛选姓名、空值及缺少姓名的客服账号", () => {
  const secondCustomer = {
    ...customer,
    relationId: "second-relation",
    followUser: "",
    followUserId: "support-2",
  }
  const content = {
    formulaTemplates: [],
    paymentOrders: [
      order({ orderId: "FIRST", customerRelationId: customer.relationId }),
      order({
        orderId: "SECOND",
        customerRelationId: secondCustomer.relationId,
      }),
      order({ orderId: "UNLINKED" }),
    ],
    salesMembers: [],
    teamMembers: [],
  } as unknown as CmsContent
  const query = {
    logic: "all" as const,
    ordersOnly: true,
    page: 1,
    pageSize: 10,
  }
  for (const [value, expected] of [
    ["客服陈", "FIRST"],
    ["support-2", "SECOND"],
  ]) {
    const result = createSalesDashboardResult(
      content,
      [customer, secondCustomer],
      {
        ...query,
        filters: [
          { field: "followUser", id: "support", operator: "eq", value },
        ],
      }
    )
    assert.deepEqual(
      result.rows.map((row) => row.orderId),
      [expected]
    )
    assert.equal(result.rows[0].salesOwner, "")
  }
  const unlinked = createSalesDashboardResult(
    content,
    [customer, secondCustomer],
    {
      ...query,
      filters: [{ field: "followUser", id: "support", operator: "empty" }],
    }
  )
  assert.deepEqual(
    unlinked.rows.map((row) => row.orderId),
    ["UNLINKED"]
  )
})
