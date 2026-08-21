import { NextRequest } from "next/server"

import { createPaymentProof } from "@/lib/payment-proof"
import {
  findPaymentOrder,
  normalizePaymentOrderId,
  readCmsContent,
  updateCmsContent,
} from "@/lib/cms-store"
import type { CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const normalizedOrderId = normalizePaymentOrderId(orderId)
  const content = await readCmsContent()
  const existing = findPaymentOrder(content, normalizedOrderId)

  if (!existing) {
    return Response.json(
      { error: "order_not_found", message: "Payment order was not found." },
      { status: 404 }
    )
  }
  if (existing.status === "cancelled" || existing.status === "failed") {
    return Response.json(
      { error: "order_not_payable", message: "该订单当前不能上传付款凭证。" },
      { status: 409 }
    )
  }

  const file = (await request.formData()).get("file")
  if (!(file instanceof File)) {
    return Response.json(
      { error: "missing_file", message: "付款凭证图片不能为空。" },
      { status: 400 }
    )
  }

  try {
    const proof = await createPaymentProof(file)
    let savedOrder = existing
    await updateCmsContent((current) => {
      const currentOrder = findPaymentOrder(current, normalizedOrderId)
      if (!currentOrder) return current
      savedOrder = {
        ...currentOrder,
        zellePaymentProof: proof,
        updatedAt: new Date().toISOString(),
      }
      return {
        ...current,
        paymentOrders: current.paymentOrders.map((item) =>
          normalizePaymentOrderId(item.orderId) === normalizedOrderId
            ? savedOrder
            : item
        ),
      }
    })
    const publicOrder = { ...savedOrder }
    delete publicOrder.airwallexPaymentIntentClientSecret
    return Response.json({ order: publicOrder })
  } catch (error) {
    return Response.json(
      {
        error: "payment_proof_invalid",
        message: error instanceof Error ? error.message : "付款凭证上传失败。",
      },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const normalizedOrderId = normalizePaymentOrderId(orderId)
  let savedOrder: CmsPaymentOrder | null = null
  await updateCmsContent((current) => {
    const currentOrder = findPaymentOrder(current, normalizedOrderId)
    if (!currentOrder) return current
    savedOrder = {
      ...currentOrder,
      zellePaymentProof: undefined,
      updatedAt: new Date().toISOString(),
    }
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
  const orderToReturn = savedOrder as CmsPaymentOrder
  const publicOrder = { ...orderToReturn }
  delete publicOrder.airwallexPaymentIntentClientSecret
  return Response.json({ order: publicOrder })
}
