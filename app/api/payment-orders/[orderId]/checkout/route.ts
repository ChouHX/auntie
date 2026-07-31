import type { NextRequest } from "next/server"

import {
  AirwallexServiceError,
  createAirwallexPaymentIntent,
  getAirwallexConfig,
  normalizePaymentCurrency,
  parsePaymentAmountValue,
} from "@/lib/airwallex"
import {
  findPaymentOrder,
  normalizePaymentOrderId,
  readCmsContent,
  updateCmsContent,
} from "@/lib/cms-store"
import {
  createPaymentOrderExpiry,
  expirePaymentOrder,
  isPaymentOrderExpired,
  isPaymentSessionExpired,
  resetExpiredPaymentSession,
} from "@/lib/payment-order-lifecycle"
import type { CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const checkoutRequest = (await request.json().catch(() => ({}))) as {
    tipAmount?: unknown
  }
  const requestedTipAmount = parseRequestedTipAmount(checkoutRequest.tipAmount)
  const content = await readCmsContent()
  let existingOrder = findPaymentOrder(content, orderId)
  const airwallexEnvironment = getAirwallexConfig().environment

  if (!existingOrder) {
    return Response.json(
      {
        error: "order_not_found",
        message: "Payment order was not found.",
        orderId: normalizePaymentOrderId(orderId),
      },
      { status: 404 }
    )
  }

  if (!content.paymentSettings.enabled) {
    return Response.json(
      {
        error: "payment_disabled",
        message: "Payment is not enabled.",
      },
      { status: 403 }
    )
  }

  if (
    existingOrder.status === "awaiting_confirmation" ||
    parsePaymentAmountValue(existingOrder.amountValue, existingOrder.amount) <=
      0
  ) {
    return Response.json(
      {
        error: "payment_order_not_ready",
        message: "The booking is awaiting service and price confirmation.",
        order: toCheckoutPaymentOrder(existingOrder),
      },
      { status: 409 }
    )
  }

  if (isPaymentOrderExpired(existingOrder)) {
    const expiredOrder = await cancelExpiredPaymentOrder(existingOrder.orderId)

    return Response.json(
      {
        error: "payment_order_expired",
        message: "This payment order has expired.",
        order: toCheckoutPaymentOrder(expiredOrder ?? existingOrder),
      },
      { status: 409 }
    )
  }

  if (isPaymentSessionExpired(existingOrder)) {
    const refreshedOrder = await resetExpiredPaymentSessionInStore(
      existingOrder.orderId
    )
    existingOrder = refreshedOrder ?? resetExpiredPaymentSession(existingOrder)
  }

  if (existingOrder.status === "cancelled") {
    return Response.json(
      {
        error: "payment_order_cancelled",
        message: "This payment order has been cancelled.",
        order: toCheckoutPaymentOrder(existingOrder),
      },
      { status: 409 }
    )
  }

  if (checkoutRequest.tipAmount !== undefined && requestedTipAmount === null) {
    return Response.json(
      {
        error: "invalid_tip_amount",
        message: "Tip amount must be between 0 and 1000.",
      },
      { status: 400 }
    )
  }

  if (existingOrder.status === "paid") {
    return Response.json({
      order: toCheckoutPaymentOrder(existingOrder),
      paymentIntent: null,
    })
  }

  if (
    existingOrder.status === "pending" &&
    existingOrder.airwallexPaymentIntentId &&
    existingOrder.airwallexPaymentIntentClientSecret
  ) {
    return Response.json({
      order: toCheckoutPaymentOrder(existingOrder),
      paymentIntent: {
        amount: parsePaymentAmountValue(
          existingOrder.amountValue,
          existingOrder.amount
        ),
        clientSecret: existingOrder.airwallexPaymentIntentClientSecret,
        currency: normalizePaymentCurrency(
          existingOrder.currency || content.paymentSettings.currency
        ),
        environment: airwallexEnvironment === "production" ? "prod" : "demo",
        id: existingOrder.airwallexPaymentIntentId,
      },
    })
  }

  try {
    const baseAmountValue = getBaseAmountValue(existingOrder)
    const tipAmount =
      normalizeTipAmount(existingOrder.tipAmount) || requestedTipAmount || 0
    const checkoutOrder: CmsPaymentOrder = {
      ...existingOrder,
      amount: formatPaymentAmount(
        baseAmountValue + tipAmount,
        existingOrder.amount
      ),
      amountValue: Number((baseAmountValue + tipAmount).toFixed(2)),
      baseAmountValue,
      paymentExpiresAt: createPaymentOrderExpiry(),
      tipAmount,
    }
    const returnUrl = createPaymentReturnUrl(request, existingOrder.orderId)
    const paymentIntent = await createAirwallexPaymentIntent({
      content,
      order: checkoutOrder,
      returnUrl,
    })
    let savedOrder: CmsPaymentOrder | null = null

    await updateCmsContent((current) => {
      const normalizedOrderId = normalizePaymentOrderId(existingOrder.orderId)
      const nextOrders = current.paymentOrders.map((order) => {
        if (normalizePaymentOrderId(order.orderId) !== normalizedOrderId) {
          return order
        }

        const nextOrder: CmsPaymentOrder = {
          ...order,
          amount: checkoutOrder.amount,
          airwallexPaymentIntentId:
            paymentIntent.id || order.airwallexPaymentIntentId,
          airwallexPaymentIntentClientSecret:
            paymentIntent.client_secret ||
            order.airwallexPaymentIntentClientSecret,
          amountValue: checkoutOrder.amountValue,
          baseAmountValue: checkoutOrder.baseAmountValue,
          currency: normalizePaymentCurrency(
            paymentIntent.currency ||
              order.currency ||
              current.paymentSettings.currency
          ),
          gatewayStatus: paymentIntent.status ?? order.gatewayStatus,
          paymentExpiresAt: checkoutOrder.paymentExpiresAt,
          provider: "airwallex",
          status: order.status === "paid" ? "paid" : "pending",
          tipAmount: checkoutOrder.tipAmount,
          updatedAt: new Date().toISOString(),
        }
        savedOrder = nextOrder

        return nextOrder
      })

      return {
        ...current,
        paymentOrders: nextOrders,
      }
    })

    return Response.json({
      order: toCheckoutPaymentOrder(savedOrder ?? checkoutOrder),
      paymentIntent: {
        amount: parsePaymentAmountValue(
          paymentIntent.amount,
          checkoutOrder.amount
        ),
        clientSecret: paymentIntent.client_secret,
        currency: normalizePaymentCurrency(
          paymentIntent.currency ||
            checkoutOrder.currency ||
            content.paymentSettings.currency
        ),
        environment: airwallexEnvironment === "production" ? "prod" : "demo",
        id: paymentIntent.id,
      },
    })
  } catch (error) {
    if (error instanceof AirwallexServiceError) {
      return Response.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.status }
      )
    }

    console.error("Airwallex checkout failed", error)

    return Response.json(
      {
        error: "payment_checkout_failed",
        message: "Payment checkout could not be started.",
      },
      { status: 502 }
    )
  }
}

async function cancelExpiredPaymentOrder(orderId: string) {
  let expiredOrder: CmsPaymentOrder | null = null

  await updateCmsContent((content) => {
    const normalizedOrderId = normalizePaymentOrderId(orderId)
    const nextOrders = content.paymentOrders.map((order) => {
      if (normalizePaymentOrderId(order.orderId) !== normalizedOrderId) {
        return order
      }

      const nextOrder = expirePaymentOrder(order)
      expiredOrder = nextOrder
      return nextOrder
    })

    return { ...content, paymentOrders: nextOrders }
  })

  return expiredOrder
}

async function resetExpiredPaymentSessionInStore(orderId: string) {
  let refreshedOrder: CmsPaymentOrder | null = null

  await updateCmsContent((content) => {
    const currentOrder = findPaymentOrder(content, orderId)
    if (!currentOrder) return content

    const nextOrder = resetExpiredPaymentSession(currentOrder)
    refreshedOrder = nextOrder
    if (nextOrder === currentOrder) return content

    const normalizedOrderId = normalizePaymentOrderId(currentOrder.orderId)
    return {
      ...content,
      paymentOrders: content.paymentOrders.map((item) =>
        normalizePaymentOrderId(item.orderId) === normalizedOrderId
          ? nextOrder
          : item
      ),
    }
  })

  return refreshedOrder
}

function getBaseAmountValue(order: CmsPaymentOrder) {
  const storedBaseAmount = Number(order.baseAmountValue)

  if (Number.isFinite(storedBaseAmount) && storedBaseAmount >= 0) {
    return storedBaseAmount
  }

  return parsePaymentAmountValue(order.amountValue, order.amount)
}

function parseRequestedTipAmount(value: unknown) {
  if (value === undefined) {
    return 0
  }

  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0 || amount > 1000) {
    return null
  }

  return Number(amount.toFixed(2))
}

function normalizeTipAmount(value: unknown) {
  const amount = Number(value)

  return Number.isFinite(amount) && amount > 0
    ? Number(Math.min(amount, 1000).toFixed(2))
    : 0
}

function formatPaymentAmount(value: number, previousAmount: string) {
  const prefix = previousAmount.trim().match(/[^\d.,\s-]+/)?.[0] ?? "$"

  return `${prefix}${value.toFixed(2)}`
}

function createPaymentReturnUrl(request: NextRequest, orderId: string) {
  const url = new URL(request.url)
  const normalizedOrderId = normalizePaymentOrderId(orderId)

  return `${url.origin}/checkout?order=${encodeURIComponent(normalizedOrderId)}&sync=1`
}

function toCheckoutPaymentOrder(order: CmsPaymentOrder): CmsPaymentOrder {
  const checkoutOrder = { ...order }

  delete checkoutOrder.airwallexPaymentIntentClientSecret
  return checkoutOrder
}
