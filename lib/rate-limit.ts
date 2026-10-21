import type { NextRequest } from "next/server"

type RateLimitRule = {
  /** 允许的最大请求数。 */
  limit: number
  /** 统计窗口（毫秒）。 */
  windowMs: number
}

type RateLimitResult = {
  allowed: boolean
  retryAfterMs: number
}

const buckets = new Map<string, number[]>()
const maxBuckets = 20_000

/**
 * 进程内滑动窗口限流。适用于单实例部署的突发防护；
 * 多实例部署时每个实例各自计数，仍能显著抬高攻击成本。
 */
function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now()
  const windowStart = now - rule.windowMs
  const timestamps = (buckets.get(key) ?? []).filter(
    (timestamp) => timestamp > windowStart
  )

  if (timestamps.length >= rule.limit) {
    buckets.set(key, timestamps)
    const retryAfterMs = Math.max(0, timestamps[0] + rule.windowMs - now)
    return { allowed: false, retryAfterMs }
  }

  timestamps.push(now)
  buckets.set(key, timestamps)

  if (buckets.size > maxBuckets) {
    pruneBuckets(windowStart)
  }

  return { allowed: true, retryAfterMs: 0 }
}

function pruneBuckets(windowStart: number) {
  for (const [key, timestamps] of buckets) {
    if (!timestamps.length || timestamps[timestamps.length - 1] <= windowStart) {
      buckets.delete(key)
    }
  }
}

/** 依次检查多条规则，返回第一条被触发的限制。 */
function enforceRateLimits(
  rules: Array<{ key: string; rule: RateLimitRule }>
): RateLimitResult {
  for (const { key, rule } of rules) {
    const result = checkRateLimit(key, rule)
    if (!result.allowed) return result
  }

  return { allowed: true, retryAfterMs: 0 }
}

/** 从常见反向代理头中解析真实客户端 IP。 */
function getClientIp(request: NextRequest) {
  const headers = request.headers
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
  ]

  return (
    candidates.map((value) => value?.trim()).find((value) => Boolean(value)) ??
    "unknown"
  )
}

export { checkRateLimit, enforceRateLimits, getClientIp }
export type { RateLimitResult, RateLimitRule }
