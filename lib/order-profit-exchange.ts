import type { CmsPaymentOrder } from "@/types/cms"

type ExchangeRateResponse = {
  base_code?: string
  rates?: Record<string, number>
  result?: string
}

type FetchExchangeRate = (
  input: string,
  init?: RequestInit
) => Promise<Response>

async function attachOrderProfitCny(
  order: CmsPaymentOrder,
  fetchExchangeRate: FetchExchangeRate = fetch
): Promise<CmsPaymentOrder> {
  const currency = String(order.currency || "USD")
    .trim()
    .toUpperCase()
  const orderProfit = Number(order.orderProfit)

  if (order.status !== "paid" || !Number.isFinite(orderProfit)) {
    return order
  }

  const storedRate = Number(order.profitExchangeRateToCny)
  const rate =
    Number.isFinite(storedRate) && storedRate > 0
      ? storedRate
      : currency === "CNY"
        ? 1
        : await fetchCnyRate(currency, fetchExchangeRate)

  return {
    ...order,
    orderProfitCny: roundMoney(orderProfit * rate),
    profitExchangeRateAt: new Date().toISOString(),
    profitExchangeRateToCny: rate,
  }
}

async function attachOrderProfitCnySafely(order: CmsPaymentOrder) {
  try {
    return await attachOrderProfitCny(order)
  } catch (error) {
    console.error(
      JSON.stringify({
        currency: order.currency || "USD",
        error: error instanceof Error ? error.message : String(error),
        event: "order.profit_exchange_rate_failed",
        orderId: order.orderId,
        timestamp: new Date().toISOString(),
      })
    )
    return order
  }
}

async function fetchCnyRate(
  currency: string,
  fetchExchangeRate: FetchExchangeRate
) {
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`Unsupported currency code: ${currency}`)
  }

  const response = await fetchExchangeRate(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(currency)}`,
    {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    }
  )
  if (!response.ok) {
    throw new Error(`Exchange rate API returned HTTP ${response.status}`)
  }

  const payload = (await response.json()) as ExchangeRateResponse
  const rate = Number(payload.rates?.CNY)
  if (
    payload.result !== "success" ||
    payload.base_code !== currency ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    throw new Error("Exchange rate API returned an invalid CNY rate")
  }
  return rate
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export { attachOrderProfitCny, attachOrderProfitCnySafely }
