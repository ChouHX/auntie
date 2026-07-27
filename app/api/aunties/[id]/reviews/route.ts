import { readCmsContent, toPublicContent } from "@/lib/cms-store"

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

function maskCustomerName(name: string) {
  const trimmed = name.trim()

  if (!trimmed) {
    return "匿名客户"
  }

  if (/^[\u4e00-\u9fff]/.test(trimmed)) {
    return `${trimmed.slice(0, 1)}**`
  }

  return `${trimmed.slice(0, 1)}***`
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const url = new URL(request.url)
  const content = await readCmsContent()
  const publicContent = toPublicContent(content)
  const auntie = publicContent.teamMembers.find((member) => member.id === id)

  if (!auntie) {
    return Response.json(
      { error: "not_found", message: "Auntie not found.", id },
      { status: 404 }
    )
  }

  const allReviews = content.paymentOrders
    .filter(
      (order) =>
        order.assignedAuntieId === id && order.status === "paid" && order.review
    )
    .map((order) => ({
      comment: order.review!.comment,
      createdAt: order.review!.createdAt,
      customerName: maskCustomerName(order.review!.customerName),
      rating: order.review!.rating,
      serviceArea: order.serviceArea,
      serviceDate: order.serviceDate,
      serviceType: order.serviceType,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const totalCount = allReviews.length
  const pageSize = clampNumber(Number(url.searchParams.get("pageSize")), 1, 20, 5)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = clampNumber(Number(url.searchParams.get("page")), 1, totalPages, 1)
  const startIndex = totalCount ? (page - 1) * pageSize : 0
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  return Response.json({
    auntie: {
      avatar: auntie.avatar,
      avatarThumb: auntie.avatarThumb,
      completedCount: auntie.completedCount,
      id: auntie.id,
      name: auntie.name,
      rating: auntie.rating,
      role: auntie.role,
      status: auntie.status,
    },
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    reviews: allReviews.slice(startIndex, endIndex),
  })
}
