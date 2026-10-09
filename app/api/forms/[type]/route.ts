import type { NextRequest } from "next/server"

import {
  normalizeFormSubmission,
  normalizeNotificationSettings,
  sendFormNotification,
} from "@/lib/form-notifications"
import { readCmsContent } from "@/lib/cms-store"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params

  if (type !== "estimate" && type !== "join") {
    return Response.json(
      {
        error: "not_found",
        message: "Form route not found.",
      },
      { status: 404 }
    )
  }

  try {
    const content = await readCmsContent()
    const body = await request.json().catch(() => ({}))
    const formType = type === "join" ? "join" : "estimate"
    const submission = normalizeFormSubmission(formType, body)

    const notificationSent = await sendFormNotification(
      normalizeNotificationSettings(content.notificationSettings),
      submission,
      {
        logoImage: content.siteSettings.logoImage,
        siteOrigin: new URL(request.url).origin,
      }
    )

    // These forms are delivered only by email; never acknowledge a dropped submission.
    if (!notificationSent) {
      return Response.json(
        {
          error: "form_notifications_disabled",
          message: "暂时无法提交申请，请通过电话或企业微信联系我们。",
        },
        { status: 503 }
      )
    }

    return Response.json({ ok: true }, { status: 202 })
  } catch (error) {
    const serviceError = error as Error & {
      error?: string
      status?: number
    }

    return Response.json(
      {
        error: serviceError.error ?? "form_notification_failed",
        message:
          serviceError.message ||
          "The form notification could not be delivered.",
      },
      { status: serviceError.status ?? 500 }
    )
  }
}
