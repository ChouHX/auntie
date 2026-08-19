import type { NextRequest } from "next/server"

import { getSalesMemberFromToken, salesSessionCookie } from "@/lib/sales-auth"
import { readCmsContent } from "@/lib/cms-store"
import { createSalesCustomerPage } from "@/lib/sales-customers"
import { listAllWecomCustomersForAnalytics } from "@/lib/wecom-store"

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
  const [content, customers] = await Promise.all([
    readCmsContent(),
    listAllWecomCustomersForAnalytics(),
  ])
  const page = Number(request.nextUrl.searchParams.get("page") ?? 1)
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 10)
  const query = request.nextUrl.searchParams.get("query") ?? ""

  return Response.json(
    createSalesCustomerPage(customers, content.salesMembers, member, {
      page,
      pageSize,
      query,
    })
  )
}
