import type { NextRequest } from "next/server"
import { after } from "next/server"

import {
  getAirwallexConfig,
  verifyAirwallexWebhookSignature,
} from "@/lib/airwallex"
import {
  findPaymentOrder,
  normalizePaymentOrderId,
  updateCmsContent,
} from "@/lib/cms-store"
import {
  normalizeNotificationSettings,
  sendPaymentOrderNotification,
} from "@/lib/form-notifications"
import type {
  CmsContent,
  CmsNotificationSettings,
  CmsPaymentOrder,
  CmsPaymentOrderStatus,
} from "@/types/cms"

export const runtime = "nodejs"

type AirwallexWebhookEvent = {
  created_at?: string
  data?: {
    object?: Record<string, unknown>
  }
  id?: string
  name?: string
}

type WebhookApplyResult = {
  eventName: string
  logoImage: string
  notificationSettings: CmsNotificationSettings | null
  order: CmsPaymentOrder | null
  processed: boolean
  shouldNotify: boolean
}

export async function POST(request: NextRequest) {
  const config = getAirwallexConfig()
  const rawBody = await request.text()
  const siteOrigin = new URL(request.url).origin
  const timestamp = request.headers.get("x-timestamp") ?? ""
  const signature = request.headers.get("x-signature") ?? ""

  if (!config.webhookSecret) {
    return Response.json(
      {
        error: "airwallex_webhook_secret_missing",
        message: "Airwallex webhook secret is not configured.",
      },
      { status: 503 }
    )
  }

  if (
    !verifyAirwallexWebhookSignature({
      rawBody,
      secret: config.webhookSecret,
      signature,
      timestamp,
    })
  ) {
    return Response.json(
      {
        error: "airwallex_webhook_signature_invalid",
        message: "Webhook signature could not be verified.",
      },
      { status: 400 }
    )
  }

  const event = parseWebhookEvent(rawBody)

  if (!event) {
    return Response.json(
      {
        error: "airwallex_webhook_invalid",
        message: "Webhook payload is invalid.",
      },
      { status: 400 }
    )
  }

  const result = await applyAirwallexWebhookEvent(event)

  if (!result.processed) {
    console.warn("Airwallex webhook was acknowledged but not applied", {
      eventId: event.id ?? "",
      eventName: result.eventName,
    })
  }

  if (result.shouldNotify && result.order && result.notificationSettings) {
    sendPaymentNotificationInBackground(result, siteOrigin)
  }

  return Response.json({
    ok: true,
    orderId: result.order?.orderId ?? null,
    processed: result.processed,
  })
}

function parseWebhookEvent(rawBody: string): AirwallexWebhookEvent | null {
  try {
    const event = JSON.parse(rawBody) as AirwallexWebhookEvent

    return event && typeof event === "object" ? event : null
  } catch {
    return null
  }
}

async function applyAirwallexWebhookEvent(
  event: AirwallexWebhookEvent
): Promise<WebhookApplyResult> {
  const eventName = event.name ?? ""
  const object = event.data?.object
  let logoImage = ""
  let notificationSettings: CmsNotificationSettings | null = null
  let order: CmsPaymentOrder | null = null
  let processed = false
  let shouldNotify = false

  if (!object || !isSupportedPaymentEvent(eventName)) {
    return {
      eventName,
      logoImage,
      notificationSettings,
      order,
      processed,
      shouldNotify,
    }
  }

  await updateCmsContent((content) => {
    const matchedOrder = findOrderForAirwallexObject(content, eventName, object)

    if (!matchedOrder) {
      return content
    }

    notificationSettings = content.notificationSettings
    logoImage = content.siteSettings.logoImage

    if (event.id && (matchedOrder.webhookEventIds ?? []).includes(event.id)) {
      order = matchedOrder
      processed = true
      return content
    }

    const nextOrder = createOrderFromAirwallexEvent(
      matchedOrder,
      eventName,
      object,
      event
    )
    order = nextOrder
    processed = true
    shouldNotify = matchedOrder.status !== "paid" && nextOrder.status === "paid"

    return {
      ...content,
      paymentOrders: content.paymentOrders.map((item) =>
        normalizePaymentOrderId(item.orderId) ===
        normalizePaymentOrderId(matchedOrder.orderId)
          ? nextOrder
          : item
      ),
    }
  })

  return {
    eventName,
    logoImage,
    notificationSettings,
    order,
    processed,
    shouldNotify,
  }
}

function findOrderForAirwallexObject(
  content: CmsContent,
  eventName: string,
  object: Record<string, unknown>
) {
  const orderId = extractOrderId(object)
  const paymentLinkId = extractPaymentLinkId(eventName, object)
  const paymentIntentId = extractPaymentIntentId(eventName, object)

  if (orderId) {
    const order = findPaymentOrder(content, orderId)

    return order &&
      isAirwallexObjectConsistentWithOrder(order, object, {
        paymentIntentId,
        paymentLinkId,
      })
      ? order
      : null
  }

  return (
    content.paymentOrders.find((order) => {
      return Boolean(
        (paymentLinkId &&
          order.airwallexPaymentLinkId &&
          order.airwallexPaymentLinkId === paymentLinkId) ||
        (paymentIntentId &&
          order.airwallexPaymentIntentId &&
          order.airwallexPaymentIntentId === paymentIntentId)
      )
    }) ?? null
  )
}

function isAirwallexObjectConsistentWithOrder(
  order: CmsPaymentOrder,
  object: Record<string, unknown>,
  ids: {
    paymentIntentId: string
    paymentLinkId: string
  }
) {
  if (
    ids.paymentLinkId &&
    order.airwallexPaymentLinkId &&
    order.airwallexPaymentLinkId !== ids.paymentLinkId
  ) {
    return false
  }

  if (
    ids.paymentIntentId &&
    order.airwallexPaymentIntentId &&
    order.airwallexPaymentIntentId !== ids.paymentIntentId
  ) {
    return false
  }

  const eventAmount = getNumber(object.amount)

  if (
    typeof eventAmount === "number" &&
    typeof order.amountValue === "number" &&
    Math.abs(eventAmount - order.amountValue) > 0.009
  ) {
    return false
  }

  return true
}

function createOrderFromAirwallexEvent(
  order: CmsPaymentOrder,
  eventName: string,
  object: Record<string, unknown>,
  event: AirwallexWebhookEvent
): CmsPaymentOrder {
  const status = getOrderStatusFromEvent(order.status, eventName)
  const paymentIntentId = extractPaymentIntentId(eventName, object)
  const paymentLinkId = extractPaymentLinkId(eventName, object)
  const now = new Date().toISOString()

  return {
    ...order,
    airwallexPaymentIntentId: paymentIntentId || order.airwallexPaymentIntentId,
    airwallexPaymentLinkId: paymentLinkId || order.airwallexPaymentLinkId,
    airwallexPaymentUrl: getString(object.url) || order.airwallexPaymentUrl,
    amountValue: getNumber(object.amount) ?? order.amountValue,
    currency: getString(object.currency) || order.currency,
    failureReason:
      status === "cancelled" || status === "failed"
        ? getFailureReason(object) || order.failureReason
        : order.failureReason,
    gatewayStatus: getString(object.status) || eventName,
    paidAt:
      status === "paid"
        ? order.paidAt || event.created_at || now
        : order.paidAt,
    provider: "airwallex",
    status,
    updatedAt: now,
    webhookEventIds: appendWebhookEventId(order.webhookEventIds, event.id),
  }
}

function getOrderStatusFromEvent(
  currentStatus: CmsPaymentOrderStatus,
  eventName: string
): CmsPaymentOrderStatus {
  if (currentStatus === "paid") {
    return "paid"
  }

  if (
    eventName === "payment_link.paid" ||
    eventName === "payment_intent.paid" ||
    eventName === "payment_intent.completed" ||
    eventName === "payment_intent.succeeded" ||
    eventName === "payment_attempt.paid" ||
    eventName === "payment_attempt.completed" ||
    eventName === "payment_attempt.settled"
  ) {
    return "paid"
  }

  if (
    eventName === "payment_intent.cancelled" ||
    eventName === "payment_attempt.cancelled" ||
    eventName === "payment_attempt.expired"
  ) {
    return "cancelled"
  }

  if (
    eventName === "payment_attempt.authentication_failed" ||
    eventName === "payment_attempt.authorization_failed" ||
    eventName === "payment_attempt.capture_failed" ||
    eventName === "payment_attempt.failed_to_process" ||
    eventName === "payment_attempt.risk_declined"
  ) {
    return "failed"
  }

  if (eventName.startsWith("payment_intent.")) {
    return "pending"
  }

  if (eventName.startsWith("payment_attempt.")) {
    return "pending"
  }

  return currentStatus
}

function isSupportedPaymentEvent(eventName: string) {
  return (
    eventName === "payment_link.paid" ||
    eventName === "payment_intent.paid" ||
    eventName === "payment_intent.completed" ||
    eventName === "payment_intent.succeeded" ||
    eventName === "payment_intent.cancelled" ||
    eventName === "payment_intent.pending" ||
    eventName === "payment_intent.pending_review" ||
    eventName === "payment_intent.requires_customer_action" ||
    eventName === "payment_intent.requires_payment_method" ||
    eventName === "payment_attempt.authentication_failed" ||
    eventName === "payment_attempt.authentication_redirected" ||
    eventName === "payment_attempt.authorization_failed" ||
    eventName === "payment_attempt.authorized" ||
    eventName === "payment_attempt.cancelled" ||
    eventName === "payment_attempt.capture_failed" ||
    eventName === "payment_attempt.capture_requested" ||
    eventName === "payment_attempt.expired" ||
    eventName === "payment_attempt.failed_to_process" ||
    eventName === "payment_attempt.paid" ||
    eventName === "payment_attempt.completed" ||
    eventName === "payment_attempt.pending_authorization" ||
    eventName === "payment_attempt.received" ||
    eventName === "payment_attempt.risk_declined" ||
    eventName === "payment_attempt.settled"
  )
}

function extractOrderId(object: Record<string, unknown> | null) {
  const metadata = getRecord(object?.metadata)

  return (
    getString(metadata.orderId) ||
    getString(metadata.order_id) ||
    getString(object?.order_id) ||
    getString(object?.merchant_order_id) ||
    getString(object?.reference)
  )
}

function extractPaymentLinkId(
  eventName: string,
  object: Record<string, unknown> | null
) {
  if (eventName.startsWith("payment_link.")) {
    return getString(object?.id)
  }

  const paymentLink = object ? object.payment_link : null
  const paymentLinkObject = getRecord(paymentLink)

  return (
    getString(object?.payment_link_id) ||
    getString(paymentLink) ||
    getString(paymentLinkObject.id)
  )
}

function extractPaymentIntentId(
  eventName: string,
  object: Record<string, unknown> | null
) {
  if (eventName.startsWith("payment_intent.")) {
    return getString(object?.id)
  }

  return (
    getString(object?.payment_intent_id) ||
    getString(object?.latest_successful_payment_intent_id)
  )
}

function appendWebhookEventId(
  eventIds: string[] | undefined,
  eventId: string | undefined
) {
  const nextEventIds = [...(eventIds ?? [])]

  if (eventId && !nextEventIds.includes(eventId)) {
    nextEventIds.push(eventId)
  }

  return nextEventIds.slice(-50)
}

function getFailureReason(object: Record<string, unknown>) {
  return (
    getString(object.failure_reason) ||
    getString(object.cancellation_reason) ||
    getString(object.message)
  )
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {}
}

function getString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function getNumber(value: unknown) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

function sendPaymentNotificationInBackground(
  result: WebhookApplyResult,
  siteOrigin: string
) {
  if (!result.order || !result.notificationSettings) {
    return
  }

  const logoImage = result.logoImage
  const notificationSettings = result.notificationSettings
  const order = result.order

  after(async () => {
    try {
      await sendPaymentOrderNotification(
        normalizeNotificationSettings(notificationSettings),
        order,
        {
          logoImage,
          siteOrigin,
        }
      )
    } catch (error) {
      console.error("Payment notification failed", error)
    }
  })
}
