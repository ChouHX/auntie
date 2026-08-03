import assert from "node:assert/strict"
import test from "node:test"

import type { CmsPaymentOrder } from "@/types/cms"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const exchange = await import("./order-profit-exchange.ts")
const { attachOrderProfitCny } = exchange

const order = {
  amount: "USD 100",
  contact: "1234567",
  createdAt: "2026-08-03T00:00:00.000Z",
  currency: "USD",
  customerName: "客户",
  note: "",
  orderId: "ORD1",
  orderProfit: 20,
  serviceAddress: "地址",
  serviceArea: "城市",
  serviceDate: "2026-08-03",
  serviceType: "日常清洁",
  status: "paid",
  updatedAt: "2026-08-03T00:00:00.000Z",
} as CmsPaymentOrder

test("按订单完成时汇率保存人民币公司利润", async () => {
  const result = await attachOrderProfitCny(order, async (url: string) => {
    assert.equal(url, "https://open.er-api.com/v6/latest/USD")
    return Response.json({
      base_code: "USD",
      rates: { CNY: 7.23 },
      result: "success",
    })
  })

  assert.equal(result.profitExchangeRateToCny, 7.23)
  assert.equal(result.orderProfitCny, 144.6)
  assert.ok(result.profitExchangeRateAt)
})

test("人民币订单使用 1:1 汇率且不请求接口", async () => {
  const result = await attachOrderProfitCny(
    { ...order, currency: "CNY" },
    async () => {
      throw new Error("不应请求汇率接口")
    }
  )

  assert.equal(result.profitExchangeRateToCny, 1)
  assert.equal(result.orderProfitCny, 20)
})
