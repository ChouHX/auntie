import {
  findPaymentOrder,
  normalizePaymentOrderId,
  readCmsContent,
} from "@/lib/cms-store"
import type { CmsPaymentOrder } from "@/types/cms"

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const content = await readCmsContent()
  const order = findPaymentOrder(content, orderId)

  if (!order) {
    return Response.json(
      {
        error: "order_not_found",
        message: "Payment order was not found.",
        orderId: normalizePaymentOrderId(orderId),
      },
      { status: 404 }
    )
  }

  return Response.json(toPublicPaymentOrder(order))
}

function toPublicPaymentOrder(order: CmsPaymentOrder): CmsPaymentOrder {
  const publicOrder = { ...order }

  delete publicOrder.airwallexPaymentIntentClientSecret
  return publicOrder
}
