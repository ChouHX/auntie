import type { NextRequest } from "next/server"

import {
  AirwallexServiceError,
  normalizePaymentCurrency,
  parsePaymentAmountValue,
  retrieveAirwallexPaymentIntent,
  retrieveAirwallexPaymentLink,
} from "@/lib/airwallex"
import {
  findPaymentOrder,
  normalizePaymentOrderId,
  readCmsContent,
  updateCmsContent,
} from "@/lib/cms-store"
import {
  normalizeNotificationSettings,
  sendPaymentOrderNotification,
} from "@/lib/form-notifications"
import { expirePaymentOrder } from "@/lib/payment-order-lifecycle"
import type {
  CmsNotificationSettings,
  CmsPaymentOrder,
  CmsPaymentOrderStatus,
} from "@/types/cms"
import { calculateOrderFinancialsSafely } from "@/lib/sales-formula"
import { persistOrderProfitCnyIfNeeded } from "@/lib/order-profit-exchange-store"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  let savedOrder: CmsPaymentOrder | null = null
  let notificationSettings: CmsNotificationSettings | null = null
  let logoImage = ""
  let shouldNotify = false

  try {
    const content = await readCmsContent()
    const existingOrder = findPaymentOrder(content, orderId)

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

    const lifecycleOrder = expirePaymentOrder(existingOrder)
    if (lifecycleOrder !== existingOrder) {
      await updateCmsContent((current) => {
        const currentOrder = findPaymentOrder(current, orderId)
        if (!currentOrder) return current
        const nextOrder = expirePaymentOrder(currentOrder)
        savedOrder = nextOrder
        return {
          ...current,
          paymentOrders: current.paymentOrders.map((item) =>
            normalizePaymentOrderId(item.orderId) ===
            normalizePaymentOrderId(currentOrder.orderId)
              ? nextOrder
              : item
          ),
        }
      })
      return Response.json({
        ok: true,
        order: toPublicPaymentOrder(savedOrder ?? lifecycleOrder),
        synced: false,
      })
    }

    savedOrder = existingOrder

    if (
      !existingOrder.airwallexPaymentIntentId &&
      !existingOrder.airwallexPaymentLinkId
    ) {
      savedOrder = await persistOrderProfitCnyIfNeeded(savedOrder)
      return Response.json({
        ok: true,
        order: toPublicPaymentOrder(savedOrder),
        synced: false,
      })
    }

    const paymentIntent = existingOrder.airwallexPaymentIntentId
      ? await retrieveAirwallexPaymentIntent(
          existingOrder.airwallexPaymentIntentId
        )
      : null
    const paymentLink =
      !paymentIntent && existingOrder.airwallexPaymentLinkId
        ? await retrieveAirwallexPaymentLink(
            existingOrder.airwallexPaymentLinkId
          )
        : null

    await updateCmsContent((current) => {
      const order = findPaymentOrder(current, orderId)

      if (!order) {
        return current
      }

      notificationSettings = current.notificationSettings
      logoImage = current.siteSettings.logoImage

      const paymentIntentGatewayStatus = paymentIntent
        ? getPaymentIntentGatewayStatus(paymentIntent)
        : ""
      const nextStatus = paymentIntent
        ? getOrderStatusFromPaymentIntent(order.status, paymentIntent)
        : getOrderStatusFromPaymentLink(order.status, paymentLink)
      const now = new Date().toISOString()
      const nextOrder: CmsPaymentOrder = calculateOrderFinancialsSafely(
        {
          ...order,
          airwallexPaymentIntentId:
            paymentIntent?.id ||
            paymentLink?.latest_successful_payment_intent_id ||
            order.airwallexPaymentIntentId,
          airwallexPaymentLinkId:
            paymentLink?.id ?? order.airwallexPaymentLinkId,
          airwallexPaymentUrl: paymentLink?.url ?? order.airwallexPaymentUrl,
          amountValue: parsePaymentAmountValue(
            paymentIntent?.amount ?? paymentLink?.amount ?? order.amountValue,
            order.amount
          ),
          dealStatus: nextStatus === "paid" ? "converted" : order.dealStatus,
          currency: normalizePaymentCurrency(
            paymentIntent?.currency || paymentLink?.currency || order.currency
          ),
          gatewayStatus:
            paymentIntentGatewayStatus ||
            paymentLink?.status ||
            order.gatewayStatus,
          paidAt: nextStatus === "paid" ? order.paidAt || now : order.paidAt,
          receivedAmount:
            nextStatus === "paid"
              ? parsePaymentAmountValue(
                  paymentIntent?.amount ??
                    paymentLink?.amount ??
                    order.amountValue,
                  order.amount
                )
              : order.receivedAmount,
          provider: "airwallex",
          status: nextStatus,
          updatedAt: now,
        },
        current
      )

      shouldNotify = order.status !== "paid" && nextOrder.status === "paid"
      savedOrder = nextOrder

      return {
        ...current,
        paymentOrders: current.paymentOrders.map((item) =>
          normalizePaymentOrderId(item.orderId) ===
          normalizePaymentOrderId(order.orderId)
            ? nextOrder
            : item
        ),
      }
    })

    if (savedOrder) {
      savedOrder = await persistOrderProfitCnyIfNeeded(savedOrder)
    }

    if (shouldNotify && savedOrder && notificationSettings) {
      try {
        await sendPaymentOrderNotification(
          normalizeNotificationSettings(notificationSettings),
          savedOrder,
          {
            logoImage,
            siteOrigin: new URL(request.url).origin,
          }
        )
      } catch (error) {
        console.error("Payment notification failed", error)
      }
    }

    return Response.json({
      ok: true,
      order: toPublicPaymentOrder(savedOrder),
      synced: true,
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

    console.error("Airwallex payment sync failed", error)

    return Response.json(
      {
        error: "payment_sync_failed",
        message: "Payment status could not be synced.",
      },
      { status: 502 }
    )
  }
}

function getOrderStatusFromPaymentLink(
  currentStatus: CmsPaymentOrderStatus,
  paymentLink: {
    latest_successful_payment_intent_id?: string
    status?: string
    successful_payment_intent_count?: number
  } | null
): CmsPaymentOrderStatus {
  if (currentStatus === "paid") {
    return "paid"
  }

  const status = String(paymentLink?.status ?? "").toLowerCase()

  if (
    paymentLink?.latest_successful_payment_intent_id ||
    Number(paymentLink?.successful_payment_intent_count ?? 0) > 0 ||
    ["paid", "succeeded", "completed"].includes(status)
  ) {
    return "paid"
  }

  if (["cancelled", "canceled", "expired", "disabled"].includes(status)) {
    return "cancelled"
  }

  if (status === "failed") {
    return "failed"
  }

  return "pending"
}

function getOrderStatusFromPaymentIntent(
  currentStatus: CmsPaymentOrderStatus,
  paymentIntent: {
    status?: string
  } & Record<string, unknown>
): CmsPaymentOrderStatus {
  if (currentStatus === "paid") {
    return "paid"
  }

  const status = getPaymentIntentGatewayStatus(paymentIntent).toLowerCase()

  if (
    [
      "succeeded",
      "success",
      "paid",
      "completed",
      "complete",
      "captured",
      "settled",
    ].includes(status)
  ) {
    return "paid"
  }

  if (["cancelled", "canceled", "expired"].includes(status)) {
    return "cancelled"
  }

  if (["failed", "declined"].includes(status)) {
    return "failed"
  }

  return "pending"
}

function getPaymentIntentGatewayStatus(
  paymentIntent: ({ status?: string } & Record<string, unknown>) | null
) {
  if (!paymentIntent) {
    return ""
  }

  return (
    getString(paymentIntent.status) ||
    getNestedString(paymentIntent, "latest_payment_attempt.status") ||
    getNestedString(paymentIntent, "payment_attempt.status") ||
    getNestedString(paymentIntent, "attempt.status")
  )
}

function getNestedString(object: Record<string, unknown>, path: string) {
  let current: unknown = object

  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object") {
      return ""
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return getString(current)
}

function getString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function toPublicPaymentOrder(order: CmsPaymentOrder): CmsPaymentOrder {
  const publicOrder = { ...order }

  delete publicOrder.airwallexPaymentIntentClientSecret
  return publicOrder
}
