import type { CmsPaymentOrder, CmsPaymentOrderStatus } from "@/types/cms"

const PAYMENT_ORDER_CACHE_KEY = "auntie-chen-home-payment-orders"
const MAX_CACHED_PAYMENT_ORDERS = 12

type CachedPaymentOrder = {
  amount: string
  createdAt: string
  currency?: string
  customerName: string
  hasZellePaymentProof: boolean
  orderId: string
  serviceArea: string
  serviceDate: string
  serviceType: string
  status: CmsPaymentOrderStatus
  updatedAt: string
}

function readCachedPaymentOrders() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(PAYMENT_ORDER_CACHE_KEY) ?? "[]"
    )

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(normalizeCachedPaymentOrder)
      .filter((order): order is CachedPaymentOrder => Boolean(order))
      .toSorted(
        (left, right) =>
          getCachedPaymentOrderTimestamp(right) -
          getCachedPaymentOrderTimestamp(left)
      )
  } catch {
    return []
  }
}

function writeCachedPaymentOrders(orders: CachedPaymentOrder[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(
      PAYMENT_ORDER_CACHE_KEY,
      JSON.stringify(orders.slice(0, MAX_CACHED_PAYMENT_ORDERS))
    )
  } catch {
    // The order list is a convenience cache; storage failures must not block UI.
  }
}

function upsertCachedPaymentOrder(order: CmsPaymentOrder | CachedPaymentOrder) {
  const cachedOrder = toCachedPaymentOrder(order)
  const nextOrders = [
    cachedOrder,
    ...readCachedPaymentOrders().filter(
      (item) => item.orderId !== cachedOrder.orderId
    ),
  ].slice(0, MAX_CACHED_PAYMENT_ORDERS)

  writeCachedPaymentOrders(nextOrders)

  return nextOrders
}

function removeCachedPaymentOrder(orderId: string) {
  const nextOrders = readCachedPaymentOrders().filter(
    (order) => order.orderId !== orderId
  )

  writeCachedPaymentOrders(nextOrders)
  return nextOrders
}

async function reconcileCachedPaymentOrders(
  fetchOrder: (orderId: string) => Promise<CmsPaymentOrder>,
  isMissingOrderError: (error: unknown) => boolean
) {
  const reconciledOrders = await Promise.all(
    readCachedPaymentOrders().map(async (cachedOrder) => {
      if (!isActiveCachedPaymentOrder(cachedOrder)) {
        return cachedOrder
      }

      try {
        return toCachedPaymentOrder(await fetchOrder(cachedOrder.orderId))
      } catch (error) {
        return isMissingOrderError(error) ? null : cachedOrder
      }
    })
  )
  const nextOrders = reconciledOrders.filter(
    (order): order is CachedPaymentOrder => Boolean(order)
  )

  writeCachedPaymentOrders(nextOrders)
  return nextOrders
}

function toCachedPaymentOrder(
  order: CmsPaymentOrder | CachedPaymentOrder
): CachedPaymentOrder {
  const now = new Date().toISOString()

  return {
    amount: order.amount ?? "",
    createdAt: order.createdAt || now,
    currency: order.currency,
    customerName: order.customerName ?? "",
    hasZellePaymentProof:
      "zellePaymentProof" in order
        ? Boolean(order.zellePaymentProof)
        : (order as CachedPaymentOrder).hasZellePaymentProof,
    orderId: order.orderId,
    serviceArea: order.serviceArea ?? "",
    serviceDate: order.serviceDate ?? "",
    serviceType: order.serviceType ?? "",
    status: order.status,
    updatedAt: order.updatedAt || order.createdAt || now,
  }
}

function isActiveCachedPaymentOrder(order: CachedPaymentOrder) {
  return order.status === "pending" || order.status === "unpaid"
}

function getCachedPaymentOrderTimestamp(order: CachedPaymentOrder) {
  const timestamp = new Date(order.updatedAt || order.createdAt).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

function normalizeCachedPaymentOrder(
  value: unknown
): CachedPaymentOrder | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<CachedPaymentOrder>

  if (!candidate.orderId || !candidate.status) {
    return null
  }

  return toCachedPaymentOrder({
    amount: String(candidate.amount ?? ""),
    createdAt: String(candidate.createdAt ?? ""),
    currency: candidate.currency,
    customerName: String(candidate.customerName ?? ""),
    hasZellePaymentProof: candidate.hasZellePaymentProof === true,
    orderId: String(candidate.orderId),
    serviceArea: String(candidate.serviceArea ?? ""),
    serviceDate: String(candidate.serviceDate ?? ""),
    serviceType: String(candidate.serviceType ?? ""),
    status: candidate.status,
    updatedAt: String(candidate.updatedAt ?? ""),
  })
}

export {
  getCachedPaymentOrderTimestamp,
  isActiveCachedPaymentOrder,
  readCachedPaymentOrders,
  reconcileCachedPaymentOrders,
  removeCachedPaymentOrder,
  upsertCachedPaymentOrder,
  writeCachedPaymentOrders,
  type CachedPaymentOrder,
}
