import type { NextRequest } from "next/server"

import { isAdminToken, readCmsContent } from "@/lib/cms-store"
import { createAuntieStatsMap } from "@/lib/admin-analytics"
import type { CmsTeamMember } from "@/types/cms"

// 展示用评价项：从订单和内嵌 review 拼装
type AuntieReviewItem = {
  orderId: string
  serviceType: string
  serviceDate: string
  serviceArea: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

type ReviewPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

type AuntieDetail = CmsTeamMember & {
  activeAssignedCount: number
  avgRating: number
  completedCount: number
  reviewCount: number
  reviews?: AuntieReviewItem[]
  reviewPagination?: ReviewPagination
}

function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number
) {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return Math.min(Math.max(value, min), max)
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!(await isAdminToken(token ?? null))) {
    return Response.json(
      { error: "unauthorized", message: "Admin authentication is required." },
      { status: 401 }
    )
  }

  const { id } = await context.params
  const content = await readCmsContent()
  const member = content.teamMembers.find((m) => m.id === id)

  if (!member) {
    return Response.json(
      { error: "not_found", message: "Auntie not found.", id },
      { status: 404 }
    )
  }

  const statsMap = createAuntieStatsMap(
    content.paymentOrders,
    content.teamMembers
  )
  const stats = statsMap[id] ?? {
    activeAssignedCount: 0,
    avgRating: 0,
    completedCount: 0,
    reviewCount: 0,
  }

  const detail: AuntieDetail = {
    ...member,
    ...stats,
    completedCount: stats.completedCount,
    rating: stats.avgRating || member.rating,
  }

  // 仅当显式请求评价列表时才拼装，避免影响现有调用
  const url = new URL(request.url)
  if (url.searchParams.get("reviews") === "1") {
    const allReviews = content.paymentOrders
      .filter(
        (order) =>
          order.assignedAuntieId === id &&
          order.status === "paid" &&
          order.review
      )
      .map((order) => ({
        orderId: order.orderId,
        serviceType: order.serviceType,
        serviceDate: order.serviceDate,
        serviceArea: order.serviceArea,
        customerName: order.review!.customerName,
        rating: order.review!.rating,
        comment: order.review!.comment,
        createdAt: order.review!.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const totalCount = allReviews.length
    const pageSize = clampNumber(
      Number(url.searchParams.get("pageSize")),
      1,
      50,
      5
    )
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const page = clampNumber(
      Number(url.searchParams.get("page")),
      1,
      totalPages,
      1
    )
    const startIndex = totalCount ? (page - 1) * pageSize : 0
    const endIndex = Math.min(startIndex + pageSize, totalCount)

    detail.reviews = allReviews.slice(startIndex, endIndex)
    detail.reviewPagination = { page, pageSize, totalCount, totalPages }
  }

  return Response.json(detail)
}
