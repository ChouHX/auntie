import assert from "node:assert/strict"
import test from "node:test"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const rateLimit = await import("./rate-limit.ts")

function uniqueKey(label: string) {
  return `${label}-${Math.random().toString(36).slice(2)}`
}

test("窗口内达到上限后拒绝并给出重试时间", () => {
  const key = uniqueKey("limit")
  const rule = { limit: 2, windowMs: 1000 }

  assert.equal(rateLimit.checkRateLimit(key, rule).allowed, true)
  assert.equal(rateLimit.checkRateLimit(key, rule).allowed, true)

  const blocked = rateLimit.checkRateLimit(key, rule)
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfterMs > 0)
  assert.ok(blocked.retryAfterMs <= 1000)
})

test("不同 key 互不影响", () => {
  const rule = { limit: 1, windowMs: 1000 }

  assert.equal(rateLimit.checkRateLimit(uniqueKey("a"), rule).allowed, true)
  assert.equal(rateLimit.checkRateLimit(uniqueKey("b"), rule).allowed, true)
})

test("enforceRateLimits 命中第一条被触发的规则", () => {
  const key = uniqueKey("enforce")
  const rules = [{ key, rule: { limit: 1, windowMs: 1000 } }]

  assert.equal(rateLimit.enforceRateLimits(rules).allowed, true)

  const blocked = rateLimit.enforceRateLimits(rules)
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfterMs > 0)
})
