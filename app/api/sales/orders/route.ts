import type { NextRequest } from "next/server"

import { getSalesMemberFromToken, salesSessionCookie } from "@/lib/sales-auth"
import { readCmsContent } from "@/lib/cms-store"
import { createSalesOrderPage } from "@/lib/sales-orders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const member = await getSalesMemberFromToken(
    request.cookies.get(salesSessionCookie)?.value
  )
  if (!member) {
    return Response.json(
      { error: "unauthorized", message: "请先登录销售账号。" },
      { status: 401 }
    )
  }
  const content = await readCmsContent()
  return Response.json(
    createSalesOrderPage(content.paymentOrders, member, {
      page: Number(request.nextUrl.searchParams.get("page") ?? 1),
      pageSize: Number(request.nextUrl.searchParams.get("pageSize") ?? 10),
      query: request.nextUrl.searchParams.get("query") ?? "",
    })
  )
}
