import type { NextRequest } from "next/server"

import {
  normalizeNotificationSettings,
  sendPaymentOrderNotification,
} from "@/lib/form-notifications"
import {
  findPaymentOrder,
  normalizePaymentOrderId,
  updateCmsContent,
} from "@/lib/cms-store"
import type { CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  if (!isManualPaymentConfirmationEnabled()) {
    return Response.json(
      {
        error: "manual_payment_confirmation_disabled",
        message: "Manual payment confirmation is disabled.",
      },
      { status: 403 }
    )
  }

  const { orderId } = await context.params
  let savedOrder: CmsPaymentOrder | null = null
  let notificationSettings = null
  let logoImage = ""
  let wasAlreadyPaid = false

  await updateCmsContent((content) => {
    const order = findPaymentOrder(content, orderId)

    if (!order) {
      return content
    }

    notificationSettings = content.notificationSettings
    logoImage = content.siteSettings.logoImage

    if (order.status === "paid") {
      wasAlreadyPaid = true
      savedOrder = order
      return content
    }

    const paidOrder = {
      ...order,
      status: "paid" as const,
      updatedAt: new Date().toISOString(),
    }
    const normalizedOrderId = normalizePaymentOrderId(order.orderId)
    savedOrder = paidOrder

    return {
      ...content,
      paymentOrders: content.paymentOrders.map((item) =>
        normalizePaymentOrderId(item.orderId) === normalizedOrderId
          ? paidOrder
          : item
      ),
    }
  })

  if (!savedOrder) {
    return Response.json(
      {
        error: "order_not_found",
        message: "Payment order was not found.",
        orderId: normalizePaymentOrderId(orderId),
      },
      { status: 404 }
    )
  }

  if (wasAlreadyPaid) {
    return Response.json({
      notificationSent: false,
      ok: true,
      order: savedOrder,
    })
  }

  let notificationSent = false

  try {
    await sendPaymentOrderNotification(
      normalizeNotificationSettings(notificationSettings),
      savedOrder,
      {
        logoImage,
        siteOrigin: new URL(request.url).origin,
      }
    )
    notificationSent = true
  } catch (error) {
    console.error("Payment notification failed", error)
  }

  return Response.json({
    notificationSent,
    ok: true,
    order: savedOrder,
  })
}

function isManualPaymentConfirmationEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_MANUAL_PAYMENT_CONFIRM === "1"
  )
}
