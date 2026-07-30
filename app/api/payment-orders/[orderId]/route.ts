import {
  findPaymentOrder,
  normalizePaymentOrderId,
  readCmsContent,
  updateCmsContent,
} from "@/lib/cms-store"
import { expirePaymentOrder } from "@/lib/payment-order-lifecycle"
import type { CmsPaymentOrder } from "@/types/cms"

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const content = await readCmsContent()
  const foundOrder = findPaymentOrder(content, orderId)

  if (!foundOrder) {
    return Response.json(
      {
        error: "order_not_found",
        message: "Payment order was not found.",
        orderId: normalizePaymentOrderId(orderId),
      },
      { status: 404 }
    )
  }

  let order = foundOrder
  const expiredOrder = expirePaymentOrder(foundOrder)

  if (expiredOrder !== foundOrder) {
    let persistedOrder: CmsPaymentOrder | null = null
    await updateCmsContent((current) => {
      const currentOrder = findPaymentOrder(current, orderId)

      if (!currentOrder) {
        return current
      }

      const nextOrder = expirePaymentOrder(currentOrder)
      persistedOrder = nextOrder

      if (nextOrder === currentOrder) {
        return current
      }

      const normalizedOrderId = normalizePaymentOrderId(currentOrder.orderId)
      return {
        ...current,
        paymentOrders: current.paymentOrders.map((item) =>
          normalizePaymentOrderId(item.orderId) === normalizedOrderId
            ? nextOrder
            : item
        ),
      }
    })
    order = persistedOrder ?? expiredOrder
  }

  return Response.json(toPublicPaymentOrder(order))
}

function toPublicPaymentOrder(order: CmsPaymentOrder): CmsPaymentOrder {
  const publicOrder = { ...order }

  delete publicOrder.airwallexPaymentIntentClientSecret
  return publicOrder
}
