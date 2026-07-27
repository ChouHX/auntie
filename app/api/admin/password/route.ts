import type { NextRequest } from "next/server"

import { isAdminToken } from "@/lib/cms-store"

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!isAdminToken(token ?? null)) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Admin authentication is required.",
      },
      { status: 401 }
    )
  }

  await request.json().catch(() => ({}))

  return Response.json({ ok: true })
}
