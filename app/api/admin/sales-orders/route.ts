import type { NextRequest } from "next/server"

import { isAdminToken, readCmsContent } from "@/lib/cms-store"
import { createSalesOrderPage } from "@/lib/sales-orders"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!(await isAdminToken(token ?? null))) {
    return Response.json(
      { error: "unauthorized", message: "请先登录管理员账号。" },
      { status: 401 }
    )
  }

  const content = await readCmsContent()
  const params = request.nextUrl.searchParams
  const member = content.salesMembers.find(
    (item) => item.id === params.get("salesMemberId")
  )
  if (!member) {
    return Response.json(
      { error: "sales_member_not_found", message: "销售不存在，请重新选择。" },
      { status: 404 }
    )
  }

  return Response.json(
    createSalesOrderPage(content.paymentOrders, member, {
      month: params.get("month") ?? "",
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 10),
      query: params.get("query") ?? "",
    })
  )
}
