import { normalizePaymentOrderId, updateCmsContent } from "@/lib/cms-store"
import { attachOrderProfitCnySafely } from "@/lib/order-profit-exchange"
import type { CmsPaymentOrder } from "@/types/cms"

async function persistOrderProfitCnyIfNeeded(order: CmsPaymentOrder) {
  if (
    order.status !== "paid" ||
    (Number.isFinite(Number(order.orderProfitCny)) &&
      Number.isFinite(Number(order.profitExchangeRateToCny)) &&
      Number(order.profitExchangeRateToCny) > 0)
  ) {
    return order
  }

  const enrichedOrder = await attachOrderProfitCnySafely(order)
  if (enrichedOrder === order) return order

  const normalizedOrderId = normalizePaymentOrderId(order.orderId)
  await updateCmsContent((content) => ({
    ...content,
    paymentOrders: content.paymentOrders.map((item) =>
      normalizePaymentOrderId(item.orderId) === normalizedOrderId
        ? enrichedOrder
        : item
    ),
  }))
  return enrichedOrder
}

export { persistOrderProfitCnyIfNeeded }
