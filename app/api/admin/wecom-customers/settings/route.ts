import type { NextRequest } from "next/server"

import { isAdminToken } from "@/lib/cms-store"
import { rescheduleWecomCustomerSync } from "@/lib/wecom-scheduler"
import { updateWecomSyncSettings } from "@/lib/wecom-store"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest) {
  if (!requireAdmin(request)) {
    return Response.json(
      { error: "unauthorized", message: "Admin authentication is required." },
      { status: 401 }
    )
  }

  const payload = (await request.json().catch(() => null)) as {
    hour?: unknown
    intervalMinutes?: unknown
    minute?: unknown
    mode?: unknown
  } | null
  const hour = Number(payload?.hour)
  const intervalMinutes = Number(payload?.intervalMinutes)
  const minute = Number(payload?.minute)
  if (
    !["daily", "disabled", "interval"].includes(String(payload?.mode)) ||
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59 ||
    !Number.isInteger(intervalMinutes) ||
    intervalMinutes < 5 ||
    intervalMinutes > 1440
  ) {
    return Response.json(
      { error: "invalid_schedule", message: "同步时间配置无效" },
      { status: 400 }
    )
  }

  await updateWecomSyncSettings({
    hour,
    intervalMinutes,
    minute,
    mode: payload?.mode as "daily" | "disabled" | "interval",
  })
  const settings = await rescheduleWecomCustomerSync()
  return Response.json({ settings })
}

function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return isAdminToken(token ?? null)
}
