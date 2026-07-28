import type { CmsPaymentOrder } from "@/types/cms"

const paymentOrderTimeoutMs = 30 * 60 * 1000

function createPaymentOrderExpiry(now = Date.now()) {
  return new Date(now + paymentOrderTimeoutMs).toISOString()
}

function isPaymentOrderExpired(order: CmsPaymentOrder, now = Date.now()) {
  if (order.status !== "pending" || !order.paymentExpiresAt) return false
  const expiresAt = new Date(order.paymentExpiresAt).getTime()
  return Number.isFinite(expiresAt) && expiresAt <= now
}

function expirePaymentOrder(order: CmsPaymentOrder, now = new Date()) {
  if (!isPaymentOrderExpired(order, now.getTime())) return order
  return {
    ...order,
    failureReason: "payment_timeout",
    gatewayStatus: "expired",
    status: "cancelled" as const,
    updatedAt: now.toISOString(),
  }
}

export { createPaymentOrderExpiry, expirePaymentOrder, isPaymentOrderExpired }
