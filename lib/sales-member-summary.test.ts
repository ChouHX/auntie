import assert from "node:assert/strict"
import test from "node:test"
import type { CmsContent } from "@/types/cms"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { createCommissionSummaries } from "./sales-member-summary.ts"

test("销售管理按服务月份汇总，区分币种、同名销售及未支付订单", () => {
  const base = {
    salesMemberId: "a",
    salesOwner: "Same",
    status: "paid",
    currency: "USD",
    amountValue: 100,
    salesCommission: 10,
    createdAt: "2026-08-31T16:00:00Z",
    paidAt: "2026-10-10T00:00:00Z",
    serviceDate: "2026-09-09",
    profitExchangeRateToCny: 7,
  }
  const content = {
    salesMembers: [
      { id: "a", name: "Same" },
      { id: "b", name: "Same" },
    ],
    paymentOrders: [
      base,
      { ...base, status: "unpaid" },
      { ...base, serviceDate: "2026-08-31" },
      { ...base, currency: "CNY", amountValue: 200 },
      { ...base, salesMemberId: "b" },
    ],
  } as CmsContent
  const result = createCommissionSummaries(content, "2026-09")
  assert.deepEqual(result[0].orderAmounts, [
    { currency: "USD", amount: 100 },
    { currency: "CNY", amount: 200 },
  ])
  assert.equal(result[0].cnyAmount, 80)
  assert.deepEqual(result[1].currencies, [{ currency: "USD", amount: 10 }])
  assert.deepEqual(
    createCommissionSummaries(content, "2025-01")[0].orderAmounts,
    []
  )
  assert.equal(
    createCommissionSummaries(content)[0].orderAmounts[0].amount,
    200
  )
})
