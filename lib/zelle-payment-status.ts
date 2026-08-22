import type { CmsPaymentOrder } from "@/types/cms"

const ZELLE_PROOF_PENDING = "ZELLE_PROOF_PENDING"
const ZELLE_PAYMENT_CONFIRMED = "ZELLE_PAYMENT_CONFIRMED"

type ZellePaymentStateSource = Pick<
  CmsPaymentOrder,
  "gatewayStatus" | "status" | "zellePaymentProof"
>

function hasZellePaymentProof(
  order: Pick<CmsPaymentOrder, "zellePaymentProof">
) {
  return Boolean(order.zellePaymentProof)
}

function isZellePaymentAwaitingReview(order: ZellePaymentStateSource) {
  return (
    hasZellePaymentProof(order) &&
    (order.status === "pending" || order.status === "unpaid")
  )
}

function isZellePaymentConfirmed(order: ZellePaymentStateSource) {
  return (
    hasZellePaymentProof(order) &&
    order.status === "paid" &&
    order.gatewayStatus === ZELLE_PAYMENT_CONFIRMED
  )
}

export {
  ZELLE_PAYMENT_CONFIRMED,
  ZELLE_PROOF_PENDING,
  hasZellePaymentProof,
  isZellePaymentAwaitingReview,
  isZellePaymentConfirmed,
}
