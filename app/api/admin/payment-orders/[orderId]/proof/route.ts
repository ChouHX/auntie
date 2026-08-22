import { NextRequest } from "next/server"

import { createPaymentProof } from "@/lib/payment-proof"
import { calculateOrderFinancialsSafely } from "@/lib/sales-formula"
import {
  ZELLE_PAYMENT_CONFIRMED,
  ZELLE_PROOF_PENDING,
} from "@/lib/zelle-payment-status"
import {
  isAdminToken,
  normalizePaymentOrderId,
  readCmsContent,
  updateCmsContent,
  findPaymentOrder,
} from "@/lib/cms-store"
import type { CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!(await isAdminToken(token ?? null))) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const { orderId } = await context.params
  const normalizedOrderId = normalizePaymentOrderId(orderId)
  const content = await readCmsContent()
  if (!findPaymentOrder(content, normalizedOrderId)) {
    return Response.json({ error: "order_not_found" }, { status: 404 })
  }
  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get("file")
  } catch {
    return Response.json(
      { error: "invalid_form_data", message: "凭证上传数据无效。" },
      { status: 400 }
    )
  }
  if (
    !file ||
    typeof file === "string" ||
    typeof file.arrayBuffer !== "function" ||
    typeof file.type !== "string"
  ) {
    return Response.json(
      { error: "missing_file", message: "凭证图片不能为空。" },
      { status: 400 }
    )
  }
  try {
    const proof = await createPaymentProof(file as File)
    let savedOrder: CmsPaymentOrder | null = null
    await updateCmsContent((current) => {
      const currentOrder = findPaymentOrder(current, normalizedOrderId)
      if (!currentOrder) return current
      const now = new Date().toISOString()
      const isZelleConfirmation = Boolean(currentOrder.zellePaymentProof)
      const paymentAmount = getPaymentAmount(currentOrder)
      const nextOrder: CmsPaymentOrder = {
        ...currentOrder,
        dealStatus: isZelleConfirmation ? "converted" : currentOrder.dealStatus,
        gatewayStatus: isZelleConfirmation
          ? ZELLE_PAYMENT_CONFIRMED
          : currentOrder.gatewayStatus,
        paidAt: isZelleConfirmation
          ? currentOrder.paidAt || now
          : currentOrder.paidAt,
        provider: isZelleConfirmation ? "offline" : currentOrder.provider,
        receivedAmount: isZelleConfirmation
          ? paymentAmount
          : currentOrder.receivedAmount,
        status: isZelleConfirmation ? "paid" : currentOrder.status,
        supportPaymentProof: proof,
        updatedAt: now,
      }
      savedOrder = isZelleConfirmation
        ? calculateOrderFinancialsSafely(nextOrder, current)
        : nextOrder
      return {
        ...current,
        paymentOrders: current.paymentOrders.map((item) =>
          normalizePaymentOrderId(item.orderId) === normalizedOrderId
            ? savedOrder!
            : item
        ),
      }
    })
    return Response.json({ order: savedOrder })
  } catch (error) {
    return Response.json(
      {
        error: "payment_proof_invalid",
        message: error instanceof Error ? error.message : "凭证上传失败。",
      },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!(await isAdminToken(token ?? null)))
    return Response.json({ error: "unauthorized" }, { status: 401 })
  const { orderId } = await context.params
  const normalizedOrderId = normalizePaymentOrderId(orderId)
  let savedOrder: CmsPaymentOrder | null = null
  await updateCmsContent((current) => {
    const currentOrder = findPaymentOrder(current, normalizedOrderId)
    if (!currentOrder) return current
    const reopensZelleReview =
      Boolean(currentOrder.zellePaymentProof) &&
      currentOrder.gatewayStatus === ZELLE_PAYMENT_CONFIRMED &&
      !currentOrder.review
    const nextOrder: CmsPaymentOrder = {
      ...currentOrder,
      dealStatus: reopensZelleReview ? "unconverted" : currentOrder.dealStatus,
      gatewayStatus: reopensZelleReview
        ? ZELLE_PROOF_PENDING
        : currentOrder.gatewayStatus,
      paidAt: reopensZelleReview ? undefined : currentOrder.paidAt,
      receivedAmount: reopensZelleReview ? 0 : currentOrder.receivedAmount,
      status: reopensZelleReview ? "pending" : currentOrder.status,
      supportPaymentProof: undefined,
      updatedAt: new Date().toISOString(),
    }
    savedOrder = reopensZelleReview
      ? calculateOrderFinancialsSafely(nextOrder, current)
      : nextOrder
    return {
      ...current,
      paymentOrders: current.paymentOrders.map((item) =>
        normalizePaymentOrderId(item.orderId) === normalizedOrderId
          ? savedOrder!
          : item
      ),
    }
  })
  if (!savedOrder)
    return Response.json({ error: "order_not_found" }, { status: 404 })
  return Response.json({ order: savedOrder })
}

function getPaymentAmount(order: CmsPaymentOrder) {
  const amountValue = Number(order.amountValue)

  if (Number.isFinite(amountValue) && amountValue >= 0) {
    return Number(amountValue.toFixed(2))
  }

  const parsed = Number(
    order.amount.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0
  )

  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : 0
}
