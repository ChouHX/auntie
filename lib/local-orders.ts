import type { CmsPaymentOrder } from "@/types/cms"

const localOrdersStorageKey = "auntie-chen-local-payment-orders"
const maxLocalOrders = 20

type LocalPaymentOrder = Pick<
  CmsPaymentOrder,
  | "amount"
  | "contact"
  | "createdAt"
  | "currency"
  | "customerName"
  | "note"
  | "orderId"
  | "paidAt"
  | "serviceAddress"
  | "serviceArea"
  | "serviceDate"
  | "serviceType"
  | "status"
  | "updatedAt"
>

function readLocalPaymentOrders() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(localOrdersStorageKey)
    const parsed = rawValue ? JSON.parse(rawValue) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(normalizeLocalPaymentOrder)
      .filter((order): order is LocalPaymentOrder => Boolean(order))
  } catch {
    return []
  }
}

function saveLocalPaymentOrder(order: CmsPaymentOrder) {
  if (typeof window === "undefined" || !order.orderId) {
    return
  }

  const nextOrder = toLocalPaymentOrder(order)
  const currentOrders = readLocalPaymentOrders()
  const nextOrders = [
    nextOrder,
    ...currentOrders.filter((item) => item.orderId !== nextOrder.orderId),
  ].slice(0, maxLocalOrders)

  writeLocalPaymentOrders(nextOrders)
}

function removeLocalPaymentOrder(orderId: string) {
  if (!orderId) {
    return
  }

  writeLocalPaymentOrders(
    readLocalPaymentOrders().filter((order) => order.orderId !== orderId)
  )
}

function clearLocalPaymentOrders() {
  writeLocalPaymentOrders([])
}

function writeLocalPaymentOrders(orders: LocalPaymentOrder[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(localOrdersStorageKey, JSON.stringify(orders))
  } catch {}
}

function toLocalPaymentOrder(order: CmsPaymentOrder): LocalPaymentOrder {
  return {
    amount: order.amount,
    contact: order.contact,
    createdAt: order.createdAt,
    currency: order.currency,
    customerName: order.customerName,
    note: order.note,
    orderId: order.orderId,
    paidAt: order.paidAt,
    serviceAddress: order.serviceAddress,
    serviceArea: order.serviceArea,
    serviceDate: order.serviceDate,
    serviceType: order.serviceType,
    status: order.status,
    updatedAt: order.updatedAt,
  }
}

function normalizeLocalPaymentOrder(value: unknown): LocalPaymentOrder | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const order = value as Partial<LocalPaymentOrder>
  const orderId = normalizeText(order.orderId)

  if (!orderId) {
    return null
  }

  return {
    amount: normalizeText(order.amount),
    contact: normalizeText(order.contact),
    createdAt: normalizeText(order.createdAt),
    currency: normalizeText(order.currency),
    customerName: normalizeText(order.customerName),
    note: normalizeText(order.note),
    orderId,
    paidAt: normalizeText(order.paidAt),
    serviceAddress: normalizeText(order.serviceAddress),
    serviceArea: normalizeText(order.serviceArea),
    serviceDate: normalizeText(order.serviceDate),
    serviceType: normalizeText(order.serviceType),
    status: normalizeStatus(order.status),
    updatedAt: normalizeText(order.updatedAt),
  }
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value : ""
}

function normalizeStatus(value: unknown): LocalPaymentOrder["status"] {
  switch (value) {
    case "cancelled":
    case "failed":
    case "paid":
    case "pending":
    case "unpaid":
      return value
    default:
      return "unpaid"
  }
}

export {
  clearLocalPaymentOrders,
  readLocalPaymentOrders,
  removeLocalPaymentOrder,
  saveLocalPaymentOrder,
}
export type { LocalPaymentOrder }
