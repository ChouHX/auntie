import type { CmsPaymentOrder, CmsSalesMember } from "@/types/cms"

type SalesOrder = {
  amount: number
  cleaningType: string
  createdAt: string
  currency: string
  customerName: string
  orderId: string
  region: string
  serviceDate: string
  status: CmsPaymentOrder["status"]
}

type SalesOrderPage = {
  orders: SalesOrder[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

function createSalesOrderPage(
  orders: CmsPaymentOrder[],
  member: CmsSalesMember,
  options: { page: number; pageSize: number; query: string }
): SalesOrderPage {
  const query = options.query.trim().toLocaleLowerCase()
  const ownedOrders = orders
    .filter((order) => isOrderOwnedBySalesMember(order, member))
    .toSorted(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  const filtered = query
    ? ownedOrders.filter((order) =>
        [
          order.orderId,
          order.customerName,
          order.status,
          order.serviceArea,
          order.serviceType,
          order.serviceDate,
          order.currency,
          order.amount,
        ].some((value) =>
          String(value ?? "")
            .toLocaleLowerCase()
            .includes(query)
        )
      )
    : ownedOrders
  const pageSize = clamp(options.pageSize, 10, 50, 10)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(1, Math.trunc(options.page) || 1), totalPages)

  return {
    orders: filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map(toSalesOrder),
    pagination: { page, pageSize, totalCount: filtered.length, totalPages },
  }
}

function isOrderOwnedBySalesMember(
  order: CmsPaymentOrder,
  member: CmsSalesMember
) {
  return order.salesMemberId
    ? order.salesMemberId === member.id
    : Boolean(order.salesOwner && order.salesOwner === member.name)
}

function toSalesOrder(order: CmsPaymentOrder): SalesOrder {
  return {
    amount: normalizeAmount(
      order.amountValue ?? order.receivedAmount ?? order.baseAmountValue
    ),
    cleaningType: order.serviceType,
    createdAt: order.createdAt,
    currency: String(order.currency || "USD").toUpperCase(),
    customerName: order.customerName,
    orderId: order.orderId,
    region: order.serviceArea,
    serviceDate: order.serviceDate,
    status: order.status,
  }
}

function normalizeAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0
}

function clamp(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.trunc(value)))
    : fallback
}

export { createSalesOrderPage, isOrderOwnedBySalesMember }
export type { SalesOrder, SalesOrderPage }
