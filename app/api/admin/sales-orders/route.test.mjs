import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mock, test } from "node:test"

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(
        new URL(`../../../../${specifier.slice(2)}.ts`, import.meta.url).href,
        context
      )
    }
    return nextResolve(specifier, context)
  },
})

let reads = 0
const content = {
  salesMembers: [
    { id: "sales-a", name: "同名销售", status: "active" },
    { id: "sales-b", name: "同名销售", status: "inactive" },
  ],
  paymentOrders: [
    ...Array.from({ length: 12 }, (_, index) => ({
      orderId: `A-${index}`,
      salesMemberId: "sales-a",
      salesOwner: "同名销售",
      serviceDate: "2026-08-31",
      createdAt: "2026-07-01T00:00:00Z",
      amountValue: 100,
      salesCommission: 10,
      currency: "USD",
      status: "paid",
    })),
    {
      orderId: "B",
      salesMemberId: "sales-b",
      salesOwner: "同名销售",
      serviceDate: "2026-08-31",
      amountValue: 800,
      currency: "USD",
    },
    {
      orderId: "SEPTEMBER",
      salesMemberId: "sales-a",
      serviceDate: "2026-09-01",
      amountValue: 900,
      currency: "USD",
    },
  ],
}

mock.module(new URL("../../../../lib/cms-store.ts", import.meta.url).href, {
  namedExports: {
    isAdminToken: async (token) => token === "admin-test-token",
    readCmsContent: async () => {
      reads++
      return structuredClone(content)
    },
  },
})
const { GET } = await import("./route.ts")

function request(params = "", token = "admin-test-token") {
  return {
    headers: new Headers(token ? { authorization: `Bearer ${token}` } : {}),
    nextUrl: new URL(`http://localhost/api/admin/sales-orders?${params}`),
  }
}

test("未认证或非管理员请求不能读取销售订单", async () => {
  for (const token of ["", "sales-token"]) {
    const before = reads
    const response = await GET(request("salesMemberId=sales-a", token))
    assert.equal(response.status, 401)
    assert.equal(reads, before)
  }
})

test("管理员按销售 ID 和服务月份读取订单，汇总包含所有页", async () => {
  const response = await GET(
    request("salesMemberId=sales-a&month=2026-08&page=2&pageSize=10")
  )
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.pagination.totalCount, 12)
  assert.equal(result.orders.length, 2)
  assert.ok(result.orders.every((order) => order.orderId.startsWith("A-")))
  assert.deepEqual(result.totals, [
    { currency: "USD", amount: 1200, commission: 120 },
  ])
})

test("支持搜索和停用销售，缺少或错误的销售 ID 不返回全部订单", async () => {
  const searched = await GET(
    request("salesMemberId=sales-a&month=2026-08&query=A-11")
  )
  assert.deepEqual(
    (await searched.json()).orders.map((order) => order.orderId),
    ["A-11"]
  )
  const inactive = await GET(request("salesMemberId=sales-b&month=2026-08"))
  assert.deepEqual(
    (await inactive.json()).orders.map((order) => order.orderId),
    ["B"]
  )
  for (const params of ["", "salesMemberId=missing"]) {
    assert.equal((await GET(request(params))).status, 404)
  }
})
