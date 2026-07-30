import type { NextRequest } from "next/server"

import { isAdminToken } from "@/lib/cms-store"
import { syncWecomCustomers } from "@/lib/wecom-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return Response.json(
      { error: "unauthorized", message: "Admin authentication is required." },
      { status: 401 }
    )
  }

  try {
    const settings = await syncWecomCustomers()
    return Response.json({ settings })
  } catch (error) {
    return Response.json(
      {
        error: "wecom_sync_failed",
        message: error instanceof Error ? error.message : "企业微信同步失败",
      },
      { status: 502 }
    )
  }
}

function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return isAdminToken(token ?? null)
}
