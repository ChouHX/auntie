import assert from "node:assert/strict"
import test from "node:test"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const lifecycle = await import("./payment-order-lifecycle.ts")
const {
  createPaymentOrderExpiry,
  expirePaymentOrder,
  isPaymentOrderExpired,
  isPaymentSessionExpired,
} = lifecycle
import type { CmsPaymentOrder } from "@/types/cms"

const now = Date.parse("2026-07-31T04:00:00.000Z")

test("creates a payment session expiry with a five-minute safety buffer", () => {
  assert.equal(createPaymentOrderExpiry(now), "2026-07-31T04:55:00.000Z")
})

test("keeps an unpaid order payable until its 24-hour deadline", () => {
  const order = createOrder({
    createdAt: new Date(now - 23 * 60 * 60 * 1000).toISOString(),
  })

  assert.equal(isPaymentOrderExpired(order, now), false)
  assert.equal(expirePaymentOrder(order, new Date(now)), order)
})

test("cancels an unpaid order after 24 hours", () => {
  const order = createOrder({
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
  })
  const expired = expirePaymentOrder(order, new Date(now))

  assert.equal(isPaymentOrderExpired(order, now), true)
  assert.equal(expired.status, "cancelled")
  assert.equal(expired.failureReason, "payment_timeout")
})

test("resets an expired payment session without cancelling the order", () => {
  const order = createOrder({
    airwallexPaymentIntentClientSecret: "secret",
    airwallexPaymentIntentId: "intent-1",
    amount: "$112.50",
    amountValue: 112.5,
    baseAmountValue: 100,
    gatewayStatus: "REQUIRES_PAYMENT_METHOD",
    paymentExpiresAt: new Date(now).toISOString(),
    status: "pending",
    tipAmount: 12.5,
  })
  const expired = expirePaymentOrder(order, new Date(now))

  assert.equal(isPaymentSessionExpired(order, now), true)
  assert.equal(expired.status, "unpaid")
  assert.equal(expired.amount, "$100.00")
  assert.equal(expired.amountValue, 100)
  assert.equal(expired.tipAmount, 0)
  assert.equal(expired.airwallexPaymentIntentId, undefined)
  assert.equal(expired.airwallexPaymentIntentClientSecret, undefined)
  assert.equal(expired.paymentExpiresAt, undefined)
})

test("the 24-hour order deadline takes priority over session renewal", () => {
  const order = createOrder({
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    paymentExpiresAt: new Date(now).toISOString(),
    status: "pending",
  })

  assert.equal(expirePaymentOrder(order, new Date(now)).status, "cancelled")
})

test("does not expire a paid order", () => {
  const order = createOrder({
    createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    paymentExpiresAt: new Date(now - 60 * 60 * 1000).toISOString(),
    status: "paid",
  })

  assert.equal(expirePaymentOrder(order, new Date(now)), order)
})

test("does not expire a Zelle order while its proof is under review", () => {
  const order = createOrder({
    createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    gatewayStatus: "ZELLE_PROOF_PENDING",
    paymentExpiresAt: new Date(now - 60 * 60 * 1000).toISOString(),
    status: "pending",
    zellePaymentProof: {
      dataUrl: "data:image/png;base64,dGVzdA==",
      fileName: "proof.png",
      mimeType: "image/png",
      uploadedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    },
  })

  assert.equal(isPaymentOrderExpired(order, now), false)
  assert.equal(isPaymentSessionExpired(order, now), false)
  assert.equal(expirePaymentOrder(order, new Date(now)), order)
})

function createOrder(
  overrides: Partial<CmsPaymentOrder> = {}
): CmsPaymentOrder {
  return {
    amount: "$100.00",
    amountValue: 100,
    baseAmountValue: 100,
    contact: "customer@example.com",
    createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
    customerName: "Customer",
    note: "",
    orderId: "ORD20260731TEST",
    serviceAddress: "Test address",
    serviceArea: "Test area",
    serviceDate: "2026-08-01",
    serviceType: "Regular cleaning",
    status: "unpaid",
    updatedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}
