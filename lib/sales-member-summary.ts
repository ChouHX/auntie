import type { CmsContent } from "@/types/cms"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { serviceMonth, validMonth } from "./sales-date.ts"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { isOrderOwnedBySalesMember } from "./sales-orders.ts"

export function createCommissionSummaries(content: CmsContent, month = "") {
  return content.salesMembers.map((member) => {
    const currencyTotals = new Map<string, number>()
    const orderTotals = new Map<string, number>()
    let cnyAmount = 0
    let missingCnyCount = 0

    content.paymentOrders.forEach((order) => {
      if (
        order.status !== "paid" ||
        !isOrderOwnedBySalesMember(order, member) ||
        (validMonth(month) &&
          !serviceMonth(order.serviceDate).startsWith(month))
      ) {
        return
      }
      const commission = normalizeSignedAmount(order.salesCommission)
      const currency = String(order.currency || "USD").toUpperCase()
      orderTotals.set(
        currency,
        (orderTotals.get(currency) ?? 0) +
          normalizeSignedAmount(
            order.amountValue ?? order.receivedAmount ?? order.baseAmountValue
          )
      )
      currencyTotals.set(
        currency,
        (currencyTotals.get(currency) ?? 0) + commission
      )
      const rate =
        currency === "CNY" ? 1 : Number(order.profitExchangeRateToCny)
      if (Number.isFinite(rate) && rate > 0) {
        cnyAmount += commission * rate
      } else if (commission !== 0) {
        missingCnyCount += 1
      }
    })

    return {
      orderAmounts: Array.from(orderTotals, ([currency, amount]) => ({
        currency,
        amount: roundMoney(amount),
      })),
      cnyAmount: roundMoney(cnyAmount),
      currencies: Array.from(currencyTotals, ([currency, amount]) => ({
        amount: roundMoney(amount),
        currency,
      })).sort((left, right) => left.currency.localeCompare(right.currency)),
      missingCnyCount,
      salesMemberId: member.id,
    }
  })
}

function normalizeSignedAmount(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
