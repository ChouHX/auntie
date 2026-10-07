import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { orderMonthOptions } from "./sales-date.ts"

const now = new Date("2026-03-15T00:00:00Z")
test("月份从最早订单连续生成到当前月，倒序排列并跨年", () => {
  assert.deepEqual(
    orderMonthOptions(
      [{ serviceDate: "2025-12-01" }, { serviceDate: "invalid" }],
      now
    ),
    ["2026-03", "2026-02", "2026-01", "2025-12"]
  )
})
test("无订单或日期无效时至少提供当前月", () => {
  assert.deepEqual(orderMonthOptions([], now), ["2026-03"])
  assert.deepEqual(orderMonthOptions([{ serviceDate: "invalid" }], now), [
    "2026-03",
  ])
})
test("服务日期月界及未来订单月份均可选", () => {
  assert.deepEqual(
    orderMonthOptions(
      [{ serviceDate: "2026-03-01" }, { serviceDate: "2026-04-01" }],
      now
    ),
    ["2026-04", "2026-03"]
  )
})
