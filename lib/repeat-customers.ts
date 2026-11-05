import type { CmsPaymentOrder } from "@/types/cms"
import type { WecomCustomer } from "@/lib/wecom-types"

type RepeatCustomerRow = {
  averageIntervalDays: number | null
  averageOrderAmount: number
  /** 复购次数 = 总订单数 - 1。 */
  repeatCount: number
  totalOrders: number
  currency: string
  customerAvatar: string
  customerName: string
  customerRelationId: string
  lastOrderAt: string
}

const repeatThreshold = 2

function isCountableOrder(order: CmsPaymentOrder) {
  return Boolean(order.orderId) && order.status !== "cancelled"
}

function normalizeOrderAmount(order: CmsPaymentOrder) {
  const amount = Number(
    order.amountValue ?? order.receivedAmount ?? order.baseAmountValue ?? 0
  )

  return Number.isFinite(amount) ? amount : 0
}

/**
 * 复购用户：绑定微信客户且有效订单数 >= 2 的用户。
 * 平均间隔按订单创建时间从小到大相邻差值的平均值计算（不足 2 单为 null）。
 */
function createRepeatCustomers(
  orders: CmsPaymentOrder[],
  customers: WecomCustomer[] = []
): RepeatCustomerRow[] {
  const customerMap = new Map(
    customers.map((customer) => [customer.relationId, customer])
  )
  const grouped = new Map<string, CmsPaymentOrder[]>()

  orders.forEach((order) => {
    if (!isCountableOrder(order)) return
    const relationId = order.customerRelationId?.trim()
    if (!relationId) return

    const list = grouped.get(relationId) ?? []
    list.push(order)
    grouped.set(relationId, list)
  })

  const rows: RepeatCustomerRow[] = []

  grouped.forEach((list, relationId) => {
    if (list.length < repeatThreshold) return

    const sorted = [...list].sort(
      (left, right) =>
        new Date(left.createdAt || 0).getTime() -
        new Date(right.createdAt || 0).getTime()
    )
    const timestamps = sorted
      .map((order) => new Date(order.createdAt || 0).getTime())
      .filter((time) => Number.isFinite(time) && time > 0)
    const intervals = timestamps
      .slice(1)
      .map((time, index) => (time - timestamps[index]) / 86_400_000)
      .filter((days) => days >= 0)
    const averageIntervalDays = intervals.length
      ? Number(
          (
            intervals.reduce((sum, days) => sum + days, 0) / intervals.length
          ).toFixed(1)
        )
      : null
    // 多币种时按订单数最多的币种展示，避免跨币种相加。
    const currencyCounts = new Map<string, number>()
    sorted.forEach((order) => {
      const currency = order.currency || "USD"
      currencyCounts.set(currency, (currencyCounts.get(currency) ?? 0) + 1)
    })
    const currency =
      Array.from(currencyCounts.entries()).sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? "USD"
    const sameCurrencyOrders = sorted.filter(
      (order) => (order.currency || "USD") === currency
    )
    const averageOrderAmount = sameCurrencyOrders.length
      ? Number(
          (
            sameCurrencyOrders.reduce(
              (sum, order) => sum + normalizeOrderAmount(order),
              0
            ) / sameCurrencyOrders.length
          ).toFixed(2)
        )
      : 0
    const customer = customerMap.get(relationId)

    rows.push({
      averageIntervalDays,
      averageOrderAmount,
      currency,
      customerAvatar: customer?.avatar ?? "",
      customerName:
        customer?.nameAndType.split("@")[0]?.trim() ||
        sorted[sorted.length - 1]?.customerName ||
        relationId,
      customerRelationId: relationId,
      lastOrderAt: sorted[sorted.length - 1]?.createdAt ?? "",
      repeatCount: sorted.length - 1,
      totalOrders: sorted.length,
    })
  })

  return rows.toSorted((left, right) => {
    if (right.repeatCount !== left.repeatCount) {
      return right.repeatCount - left.repeatCount
    }

    return (
      new Date(right.lastOrderAt || 0).getTime() -
      new Date(left.lastOrderAt || 0).getTime()
    )
  })
}

type RepeatCustomerOrderDetail = {
  orderId: string
  serviceDate: string
  serviceType: string
  serviceArea: string
  status: CmsPaymentOrder["status"]
  currency: string
  amount: number
  auntieName: string
  /** 与上一单（更早一单）的间隔天数，最早一单为 null。 */
  intervalDays: number | null
}

/**
 * 客户订单明细（用于折叠展开），按创建时间倒序，并计算与上一单的间隔。
 * 订单列表载荷可能只包含部分订单，因此需单独按客户查询全量订单。
 */
function createCustomerOrderDetails(
  orders: CmsPaymentOrder[],
  customerRelationId: string,
  auntieNames: Record<string, string> = {}
): RepeatCustomerOrderDetail[] {
  const target = customerRelationId.trim()
  if (!target) return []

  const sorted = orders
    .filter(
      (order) =>
        isCountableOrder(order) && order.customerRelationId?.trim() === target
    )
    .toSorted(
      (left, right) =>
        new Date(left.createdAt || 0).getTime() -
        new Date(right.createdAt || 0).getTime()
    )

  const details = sorted.map((order, index) => {
    const current = new Date(order.createdAt || 0).getTime()
    const previous =
      index > 0 ? new Date(sorted[index - 1].createdAt || 0).getTime() : NaN
    const intervalDays =
      Number.isFinite(current) && Number.isFinite(previous)
        ? Number(((current - previous) / 86_400_000).toFixed(1))
        : null

    return {
      amount: normalizeOrderAmount(order),
      auntieName:
        (order.assignedAuntieId
          ? auntieNames[order.assignedAuntieId]
          : undefined) ?? "",
      currency: order.currency || "USD",
      intervalDays,
      orderId: order.orderId,
      serviceArea: order.serviceArea ?? "",
      serviceDate: order.serviceDate ?? "",
      serviceType: order.serviceType ?? "",
      status: order.status,
    } satisfies RepeatCustomerOrderDetail
  })

  return details.reverse()
}

export { createCustomerOrderDetails, createRepeatCustomers, repeatThreshold }
export type { RepeatCustomerOrderDetail, RepeatCustomerRow }
