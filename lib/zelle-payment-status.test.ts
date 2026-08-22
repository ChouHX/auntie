import assert from "node:assert/strict"
import test from "node:test"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const statusHelpers = await import("./zelle-payment-status.ts")
const { isZellePaymentAwaitingReview, isZellePaymentConfirmed } = statusHelpers

const proof = {
  dataUrl: "data:image/png;base64,dGVzdA==",
  fileName: "proof.png",
  mimeType: "image/png",
  uploadedAt: "2026-08-22T00:00:00.000Z",
}

test("treats pending and legacy unpaid Zelle proofs as awaiting review", () => {
  assert.equal(
    isZellePaymentAwaitingReview({
      gatewayStatus: "ZELLE_PROOF_PENDING",
      status: "pending",
      zellePaymentProof: proof,
    }),
    true
  )
  assert.equal(
    isZellePaymentAwaitingReview({
      gatewayStatus: "",
      status: "unpaid",
      zellePaymentProof: proof,
    }),
    true
  )
})

test("only treats a confirmed paid Zelle order as confirmed", () => {
  assert.equal(
    isZellePaymentConfirmed({
      gatewayStatus: "ZELLE_PAYMENT_CONFIRMED",
      status: "paid",
      zellePaymentProof: proof,
    }),
    true
  )
  assert.equal(
    isZellePaymentConfirmed({
      gatewayStatus: "ZELLE_PROOF_PENDING",
      status: "pending",
      zellePaymentProof: proof,
    }),
    false
  )
})
