import type { NextRequest } from "next/server"

import { getSalesMemberFromToken, salesSessionCookie } from "@/lib/sales-auth"
import { readCmsContent } from "@/lib/cms-store"
import { createSalesUserDashboard } from "@/lib/sales-user-dashboard"
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
  return Response.json(createSalesUserDashboard(content, customers, member))
}
