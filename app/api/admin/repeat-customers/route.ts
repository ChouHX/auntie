import type { NextRequest } from "next/server"

import { isAdminToken, readCmsContent } from "@/lib/cms-store"
import {
  createCustomerOrderDetails,
  createRepeatCustomers,
} from "@/lib/repeat-customers"
import {
  listAllWecomCustomersForAnalytics,
  listWecomCustomers,
} from "@/lib/wecom-store"
import type {
  RepeatCustomerOrderDetail,
  RepeatCustomerRow,
} from "@/lib/repeat-customers"

export const runtime = "nodejs"

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  return isAdminToken(token ?? null)
}

function unauthorized() {
  return Response.json(
    { error: "unauthorized", message: "Admin authentication is required." },
    { status: 401 }
  )
}

/**
 * 复购用户列表：仅有 2 次及以上有效订单的微信客户。
 * customerQuery 用于按客户名称/关系 ID 模糊筛选，结果仍在服务端聚合后再分页。
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()

  const searchParams = request.nextUrl.searchParams
  const customerQuery = (searchParams.get("customerQuery") ?? "")
    .trim()
    .toLocaleLowerCase()
  const [content, customers] = await Promise.all([
    readCmsContent(),
    listAllWecomCustomersForAnalytics(),
  ])

  let rows: RepeatCustomerRow[] = createRepeatCustomers(
    content.paymentOrders,
    customers
  )

  if (customerQuery) {
    rows = rows.filter(
      (row) =>
        row.customerName.toLocaleLowerCase().includes(customerQuery) ||
        row.customerRelationId.toLocaleLowerCase().includes(customerQuery)
    )
  }

  return Response.json({ rows })
}

/** 客户候选搜索（懒加载，用于表头筛选下拉）。 */
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()

  const body = (await request.json().catch(() => ({}))) as {
    page?: number
    pageSize?: number
    query?: string
  }
  const result = await listWecomCustomers({
    page: Number(body.page) || 1,
    pageSize: Math.min(Math.max(Number(body.pageSize) || 20, 1), 50),
    query: body.query ?? "",
  })

  return Response.json(result)
}

/** 单个客户的订单明细，按需查询（用于折叠展开）。 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()

  const body = (await request.json().catch(() => ({}))) as {
    customerRelationId?: string
  }
  const customerRelationId = body.customerRelationId?.trim()

  if (!customerRelationId) {
    return Response.json(
      { error: "customer_relation_id_required", message: "客户不能为空。" },
      { status: 400 }
    )
  }

  const content = await readCmsContent()
  const auntieNames = Object.fromEntries(
    (content.teamMembers ?? []).map((member) => [member.id, member.name])
  )
  const orders: RepeatCustomerOrderDetail[] = createCustomerOrderDetails(
    content.paymentOrders,
    customerRelationId,
    auntieNames
  )

  return Response.json({ orders })
}
