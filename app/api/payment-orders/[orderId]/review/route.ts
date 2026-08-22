import type { NextRequest } from "next/server"

import {
  findPaymentOrder,
  normalizePaymentOrderId,
  updateCmsContent,
} from "@/lib/cms-store"
import type { CmsOrderReview, CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params

  let body: { comment?: string; rating?: number }

  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Invalid request body" }, { status: 400 })
  }

  const rating = Number(body.rating)
  const comment = String(body.comment ?? "").trim()

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return Response.json({ message: "评分必须在 1-5 之间" }, { status: 400 })
  }

  if (comment.length > 500) {
    return Response.json(
      { message: "评价内容不能超过 500 字" },
      { status: 400 }
    )
  }

  let savedOrder: CmsPaymentOrder | null = null
  let alreadyReviewed = false

  await updateCmsContent((content) => {
    const order = findPaymentOrder(content, orderId)

    if (!order) {
      return content
    }

    if (order.status !== "paid") {
      return content
    }

    if (order.review) {
      alreadyReviewed = true
      savedOrder = order
      return content
    }

    const review: CmsOrderReview = {
      rating,
      comment,
      createdAt: new Date().toISOString(),
      customerName: order.customerName,
    }

    const reviewedOrder: CmsPaymentOrder = {
      ...order,
      review,
      updatedAt: new Date().toISOString(),
    }

    savedOrder = reviewedOrder
    const normalizedId = normalizePaymentOrderId(order.orderId)

    return {
      ...content,
      paymentOrders: content.paymentOrders.map((item) =>
        normalizePaymentOrderId(item.orderId) === normalizedId
          ? reviewedOrder
          : item
      ),
    }
  })

  if (!savedOrder) {
    return Response.json({ message: "订单不存在或未付款" }, { status: 404 })
  }

  if (alreadyReviewed) {
    return Response.json(
      { message: "该订单已评价", order: toPublicPaymentOrder(savedOrder) },
      { status: 409 }
    )
  }

  return Response.json({
    ok: true,
    order: toPublicPaymentOrder(savedOrder),
  })
}

function toPublicPaymentOrder(order: CmsPaymentOrder): CmsPaymentOrder {
  const publicOrder = { ...order }

  delete publicOrder.airwallexPaymentIntentClientSecret
  return publicOrder
}
