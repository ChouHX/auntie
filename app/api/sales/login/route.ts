import { NextResponse, type NextRequest } from "next/server"

import {
  authenticateSalesMember,
  salesSessionCookie,
  sessionMaxAge,
} from "@/lib/sales-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    password?: unknown
    username?: unknown
  }
  const result = await authenticateSalesMember(
    String(body.username ?? ""),
    String(body.password ?? "")
  )
  if (!result) {
    return NextResponse.json(
      { error: "invalid_credentials", message: "账号或密码错误。" },
      { status: 401 }
    )
  }
  const response = NextResponse.json({
    user: { name: result.member.name, username: result.member.accountUsername },
  })
  response.cookies.set(salesSessionCookie, result.token, {
    httpOnly: true,
    maxAge: sessionMaxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
