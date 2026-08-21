import { NextRequest } from "next/server"

import { createPaymentProof } from "@/lib/payment-proof"
import {
  isAdminToken,
  normalizePaymentOrderId,
  readCmsContent,
  updateCmsContent,
  findPaymentOrder,
} from "@/lib/cms-store"

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
  const file = (await request.formData()).get("file")
  if (!(file instanceof File)) {
    return Response.json(
      { error: "missing_file", message: "凭证图片不能为空。" },
      { status: 400 }
    )
  }
  try {
    const proof = await createPaymentProof(file)
    let savedOrder = null
    await updateCmsContent((current) => {
      const currentOrder = findPaymentOrder(current, normalizedOrderId)
      if (!currentOrder) return current
      savedOrder = {
        ...currentOrder,
        supportPaymentProof: proof,
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
  let savedOrder = null
  await updateCmsContent((current) => {
    const currentOrder = findPaymentOrder(current, normalizedOrderId)
    if (!currentOrder) return current
    savedOrder = {
      ...currentOrder,
      supportPaymentProof: undefined,
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
  return Response.json({ order: savedOrder })
}
