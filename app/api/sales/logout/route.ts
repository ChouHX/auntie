import { NextResponse } from "next/server"

import { salesSessionCookie } from "@/lib/sales-auth"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(salesSessionCookie, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  })
  return response
}
