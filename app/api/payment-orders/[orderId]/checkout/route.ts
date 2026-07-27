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
import type { CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const content = await readCmsContent()
  const existingOrder = findPaymentOrder(content, orderId)
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
        environment:
          airwallexEnvironment === "production" ? "prod" : "demo",
        id: existingOrder.airwallexPaymentIntentId,
      },
    })
  }

  try {
    const returnUrl = createPaymentReturnUrl(request, existingOrder.orderId)
    const paymentIntent = await createAirwallexPaymentIntent({
      content,
      order: existingOrder,
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
          airwallexPaymentIntentId:
            paymentIntent.id ||
            order.airwallexPaymentIntentId,
          airwallexPaymentIntentClientSecret:
            paymentIntent.client_secret ||
            order.airwallexPaymentIntentClientSecret,
          amountValue: parsePaymentAmountValue(order.amountValue, order.amount),
          currency: normalizePaymentCurrency(
            paymentIntent.currency ||
              order.currency ||
              current.paymentSettings.currency
          ),
          gatewayStatus: paymentIntent.status ?? order.gatewayStatus,
          provider: "airwallex",
          status: order.status === "paid" ? "paid" : "pending",
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
      order: toCheckoutPaymentOrder(savedOrder ?? existingOrder),
      paymentIntent: {
        amount: parsePaymentAmountValue(
          paymentIntent.amount,
          existingOrder.amount
        ),
        clientSecret: paymentIntent.client_secret,
        currency: normalizePaymentCurrency(
          paymentIntent.currency ||
            existingOrder.currency ||
            content.paymentSettings.currency
        ),
        environment:
          airwallexEnvironment === "production" ? "prod" : "demo",
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
