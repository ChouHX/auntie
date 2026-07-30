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
    enabled?: unknown
    hour?: unknown
    minute?: unknown
  } | null
  const hour = Number(payload?.hour)
  const minute = Number(payload?.minute)
  if (
    typeof payload?.enabled !== "boolean" ||
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return Response.json(
      { error: "invalid_schedule", message: "同步时间配置无效" },
      { status: 400 }
    )
  }

  await updateWecomSyncSettings({ enabled: payload.enabled, hour, minute })
  const settings = await rescheduleWecomCustomerSync()
  return Response.json({ settings })
}

function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return isAdminToken(token ?? null)
}
