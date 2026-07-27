import type { NextRequest } from "next/server"

import { createAdminToken } from "@/lib/cms-store"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const username = String(body.username ?? "")
  const password = String(body.password ?? "")

  if (username !== "admin" || password !== "admin123") {
    return Response.json(
      {
        error: "invalid_credentials",
        message: "Invalid username or password.",
      },
      { status: 401 }
    )
  }

  return Response.json({
    token: createAdminToken(),
    user: { username },
  })
}
