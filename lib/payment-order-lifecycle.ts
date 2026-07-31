import type { CmsPaymentOrder } from "@/types/cms"

// Airwallex client secrets are valid for 60 minutes. Keep a small buffer so
// the browser does not start a payment with a secret that is about to expire.
const paymentOrderTimeoutMs = 55 * 60 * 1000
const unpaidOrderTimeoutMs = 24 * 60 * 60 * 1000

function createPaymentOrderExpiry(now = Date.now()) {
  return new Date(now + paymentOrderTimeoutMs).toISOString()
}

function isPaymentOrderExpired(order: CmsPaymentOrder, now = Date.now()) {
  if (!["pending", "unpaid"].includes(order.status) || !order.createdAt) {
    return false
  }
  const expiresAt = new Date(order.createdAt).getTime() + unpaidOrderTimeoutMs
  return Number.isFinite(expiresAt) && expiresAt <= now
}

function isPaymentSessionExpired(order: CmsPaymentOrder, now = Date.now()) {
  if (order.status !== "pending" || !order.paymentExpiresAt) return false
  const expiresAt = new Date(order.paymentExpiresAt).getTime()
  return Number.isFinite(expiresAt) && expiresAt <= now
}

function expirePaymentOrder(order: CmsPaymentOrder, now = new Date()) {
  if (isPaymentOrderExpired(order, now.getTime())) {
    return {
      ...order,
      failureReason: "payment_timeout",
      gatewayStatus: "expired",
      status: "cancelled" as const,
      updatedAt: now.toISOString(),
    }
  }

  return resetExpiredPaymentSession(order, now)
}

function resetExpiredPaymentSession(order: CmsPaymentOrder, now = new Date()) {
  if (!isPaymentSessionExpired(order, now.getTime())) return order
  const baseAmountValue = getBaseAmountValue(order)

  return {
    ...order,
    amount: formatPaymentAmount(baseAmountValue, order.amount),
    amountValue: baseAmountValue,
    baseAmountValue,
    airwallexPaymentIntentClientSecret: undefined,
    airwallexPaymentIntentId: undefined,
    failureReason: "payment_session_expired",
    gatewayStatus: "expired",
    paymentExpiresAt: undefined,
    status: "unpaid" as const,
    tipAmount: 0,
    updatedAt: now.toISOString(),
  }
}

function getBaseAmountValue(order: CmsPaymentOrder) {
  const storedBaseAmount = Number(order.baseAmountValue)
  if (Number.isFinite(storedBaseAmount) && storedBaseAmount >= 0) {
    return storedBaseAmount
  }

  const amountValue = Number(order.amountValue)
  return Number.isFinite(amountValue) && amountValue >= 0
    ? amountValue
    : parsePaymentAmount(order.amount)
}

function parsePaymentAmount(value: string) {
  return Number(value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0)
}

function formatPaymentAmount(value: number, previousAmount: string) {
  const prefix = previousAmount.trim().match(/[^\d.,\s-]+/)?.[0] ?? "$"
  return `${prefix}${value.toFixed(2)}`
}

export {
  createPaymentOrderExpiry,
  expirePaymentOrder,
  isPaymentOrderExpired,
  isPaymentSessionExpired,
  resetExpiredPaymentSession,
}
