import { NextResponse, type NextRequest } from "next/server"

import {
  changeSalesPassword,
  getSalesMemberFromToken,
  salesSessionCookie,
  sessionMaxAge,
} from "@/lib/sales-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const member = await getSalesMemberFromToken(
    request.cookies.get(salesSessionCookie)?.value
  )
  if (!member) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录销售账号。" },
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
    return NextResponse.json(
      { error: "invalid_password", message: "新密码至少需要 8 位。" },
      { status: 400 }
    )
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "password_unchanged", message: "新密码不能与当前密码相同。" },
      { status: 400 }
    )
  }
  const token = await changeSalesPassword(
    member.id,
    currentPassword,
    newPassword
  )
  if (!token) {
    return NextResponse.json(
      { error: "invalid_password", message: "当前密码不正确。" },
      { status: 401 }
    )
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(salesSessionCookie, token, {
    httpOnly: true,
    maxAge: sessionMaxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
