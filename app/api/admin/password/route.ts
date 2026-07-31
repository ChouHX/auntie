import type { NextRequest } from "next/server"

import { changeAdminPassword, isAdminToken } from "@/lib/cms-store"

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!(await isAdminToken(token ?? null))) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Admin authentication is required.",
      },
      { status: 401 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    currentPassword?: unknown
    newPassword?: unknown
  }
  const currentPassword = String(body.currentPassword ?? "")
  const newPassword = String(body.newPassword ?? "")
  if (newPassword.length < 8) {
    return Response.json(
      {
        error: "invalid_password",
        message: "New password must be at least 8 characters.",
      },
      { status: 400 }
    )
  }

  const nextToken = await changeAdminPassword(currentPassword, newPassword)
  if (!nextToken) {
    return Response.json(
      {
        error: "invalid_password",
        message: "Current password is incorrect.",
      },
      { status: 401 }
    )
  }

  return Response.json({ ok: true, token: nextToken })
}
