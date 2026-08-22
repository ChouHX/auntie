// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { isPaymentOrderCompleted } from "./auntie-assignment.ts"
import type { CmsPaymentOrder } from "@/types/cms"

function normalizePaymentOrderId(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function isSamePaymentOrderId(left: string, right: string) {
  const normalizedLeft = normalizePaymentOrderId(left)
  const normalizedRight = normalizePaymentOrderId(right)

  return Boolean(normalizedLeft && normalizedLeft === normalizedRight)
}

function findPaymentOrderById(orders: CmsPaymentOrder[], orderId: string) {
  return orders.find((order) => isSamePaymentOrderId(order.orderId, orderId))
}

function upsertPaymentOrderInCollection(
  orders: CmsPaymentOrder[],
  order: CmsPaymentOrder
) {
  const matchingOrders = orders.filter((item) =>
    isSamePaymentOrderId(item.orderId, order.orderId)
  )

  if (matchingOrders.some((item) => isPaymentOrderCompleted(item))) {
    throw new Error("已完成订单只能查看详情，不能再编辑。")
  }

  if (!matchingOrders.length) {
    return [order, ...orders]
  }

  let replaced = false

  return orders.flatMap((item) => {
    if (!isSamePaymentOrderId(item.orderId, order.orderId)) {
      return [item]
    }

    if (replaced) {
      return []
    }

    replaced = true
    return [order]
  })
}

function deletePaymentOrderFromCollection(
  orders: CmsPaymentOrder[],
  orderId: string
) {
  const matchingOrders = orders.filter((order) =>
    isSamePaymentOrderId(order.orderId, orderId)
  )

  if (matchingOrders.some((order) => isPaymentOrderCompleted(order))) {
    throw new Error("已完成订单只能查看详情，不能删除。")
  }

  return orders.filter((order) => !isSamePaymentOrderId(order.orderId, orderId))
}

function dedupePaymentOrdersById(orders: CmsPaymentOrder[]) {
  const seen = new Set<string>()

  return orders.filter((order) => {
    const normalizedId = normalizePaymentOrderId(order.orderId)

    if (!normalizedId || seen.has(normalizedId)) {
      return false
    }

    seen.add(normalizedId)
    return true
  })
}

export {
  dedupePaymentOrdersById,
  deletePaymentOrderFromCollection,
  findPaymentOrderById,
  isSamePaymentOrderId,
  normalizePaymentOrderId,
  upsertPaymentOrderInCollection,
}
