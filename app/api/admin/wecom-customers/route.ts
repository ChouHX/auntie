import type { NextRequest } from "next/server"

import { isAdminToken } from "@/lib/cms-store"
import { listWecomCustomers } from "@/lib/wecom-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return Response.json(
      { error: "unauthorized", message: "Admin authentication is required." },
      { status: 401 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const result = await listWecomCustomers({
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 20,
    query: searchParams.get("query") ?? "",
  })
  return Response.json(result)
}

function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return isAdminToken(token ?? null)
}
