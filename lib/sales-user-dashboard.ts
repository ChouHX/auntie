// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { findSalesMemberForStudentTags } from "./sales-attribution.ts"
import type { WecomCustomer } from "@/lib/wecom-types"
import type { CmsContent, CmsPaymentOrder, CmsSalesMember } from "@/types/cms"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { isOrderOwnedBySalesMember } from "./sales-orders.ts"

type MoneyTotal = { amount: number; currency: string }
type SalesOrderRanking = {
  amountCny: number
  amounts: MoneyTotal[]
  orderCount: number
  salesMemberId: string
  salesName: string
}
type SalesUserDashboard = {
  customerCounts: { month: number; today: number; total: number; week: number }
  member: { id: string; name: string; username: string }
  monthLabel: string
  monthlyProfit: MoneyTotal[]
  orderCountRanking: SalesOrderRanking[]
  orderProfitTotal: MoneyTotal[]
  orderRevenueRanking: SalesOrderRanking[]
}

function createSalesUserDashboard(
  content: CmsContent,
  customers: WecomCustomer[],
  currentMember: CmsSalesMember,
  now = new Date()
): SalesUserDashboard {
  const today = shanghaiDate(now)
  const month = today.slice(0, 7)
  const weekStart = getWeekStart(today)
  const ownedCustomers = customers.filter(
    (customer) =>
      findSalesMemberForStudentTags(customer.studentType, content.salesMembers)
        ?.id === currentMember.id
  )
  const ownedPaidOrders = content.paymentOrders.filter(
    (order) =>
      order.status === "paid" && isOrderOwnedBySalesMember(order, currentMember)
  )
  const monthlyPaidOrders = content.paymentOrders.filter(
    (order) =>
      order.status === "paid" &&
      shanghaiDate(
        new Date(order.paidAt || order.updatedAt || order.createdAt)
      ).startsWith(month)
  )
  const rankings = content.salesMembers
    .filter((member) => member.status === "active")
    .map((member) => createRanking(member, monthlyPaidOrders))

  return {
    customerCounts: {
      month: ownedCustomers.filter((customer) =>
        shanghaiDate(new Date(customer.addTime)).startsWith(month)
      ).length,
      today: ownedCustomers.filter(
        (customer) => shanghaiDate(new Date(customer.addTime)) === today
      ).length,
      total: ownedCustomers.length,
      week: ownedCustomers.filter((customer) => {
        const date = shanghaiDate(new Date(customer.addTime))
        return date >= weekStart && date <= today
      }).length,
    },
    member: {
      id: currentMember.id,
      name: currentMember.name,
      username: currentMember.accountUsername ?? "",
    },
    monthLabel: `${Number(month.slice(5, 7))} 月`,
    monthlyProfit: sumMoney(
      ownedPaidOrders.filter((order) =>
        shanghaiDate(
          new Date(order.paidAt || order.updatedAt || order.createdAt)
        ).startsWith(month)
      ),
      "orderProfit"
    ),
    orderCountRanking: rankings.toSorted(
      (left, right) =>
        right.orderCount - left.orderCount || right.amountCny - left.amountCny
    ),
    orderProfitTotal: sumMoney(ownedPaidOrders, "orderProfit"),
    orderRevenueRanking: rankings.toSorted(
      (left, right) =>
        right.amountCny - left.amountCny || right.orderCount - left.orderCount
    ),
  }
}

function createRanking(member: CmsSalesMember, orders: CmsPaymentOrder[]) {
  const memberOrders = orders.filter((order) =>
    isOrderOwnedBySalesMember(order, member)
  )
  return {
    amountCny: roundMoney(
      memberOrders.reduce((total, order) => {
        const amount = Number(order.receivedAmount ?? order.amountValue) || 0
        const currency = (order.currency || "USD").toUpperCase()
        const rate =
          currency === "CNY" ? 1 : Number(order.profitExchangeRateToCny)
        return (
          total + (Number.isFinite(rate) && rate > 0 ? amount * rate : amount)
        )
      }, 0)
    ),
    amounts: sumMoney(memberOrders, "receivedAmount"),
    orderCount: memberOrders.length,
    salesMemberId: member.id,
    salesName: member.name,
  }
}

function sumMoney(
  orders: CmsPaymentOrder[],
  field: "orderProfit" | "receivedAmount"
) {
  const totals = new Map<string, number>()
  orders.forEach((order) => {
    const currency = (order.currency || "USD").toUpperCase()
    const fallback = field === "receivedAmount" ? order.amountValue : 0
    const amount = Number(order[field] ?? fallback) || 0
    totals.set(currency, (totals.get(currency) ?? 0) + amount)
  })
  return Array.from(totals, ([currency, amount]) => ({
    amount: roundMoney(amount),
    currency,
  })).toSorted((left, right) => left.currency.localeCompare(right.currency))
}

function shanghaiDate(date: Date) {
  if (!Number.isFinite(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(date)
}

function getWeekStart(date: string) {
  const value = new Date(`${date}T00:00:00Z`)
  const day = value.getUTCDay() || 7
  value.setUTCDate(value.getUTCDate() - day + 1)
  return shanghaiDate(value)
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export { createSalesUserDashboard }
export type { MoneyTotal, SalesOrderRanking, SalesUserDashboard }
