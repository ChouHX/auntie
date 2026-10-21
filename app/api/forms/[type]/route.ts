import type { NextRequest } from "next/server"

import {
  normalizeFormSubmission,
  normalizeNotificationSettings,
  sendFormNotification,
} from "@/lib/form-notifications"
import { readCmsContent } from "@/lib/cms-store"
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit"

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

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >
  const clientIp = getClientIp(request)
  const rateLimit = enforceRateLimits([
    { key: `form:burst:${clientIp}`, rule: { limit: 1, windowMs: 10_000 } },
    { key: `form:ip:${clientIp}`, rule: { limit: 6, windowMs: 10 * 60_000 } },
  ])

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(rateLimit.retryAfterMs / 1000)
    )

    return Response.json(
      {
        error: "rate_limited",
        message: "提交过于频繁，请稍后再试。",
      },
      { headers: { "Retry-After": String(retryAfterSeconds) }, status: 429 }
    )
  }

  const formPayload = { ...body }

  try {
    const content = await readCmsContent()
    const formType = type === "join" ? "join" : "estimate"
    const submission = normalizeFormSubmission(formType, formPayload)

    const notificationSent = await sendFormNotification(
      normalizeNotificationSettings(content.notificationSettings),
      submission,
      {
        logoImage: content.siteSettings.logoImage,
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
