import type { CmsPaymentOrder } from "@/types/cms"

type AuntieStats = {
  avgRating: number
  completedCount: number
  reviewCount: number
}

function calculateAuntieStats(
  auntieId: string,
  orders: CmsPaymentOrder[]
): AuntieStats {
  const assignedOrders = orders.filter(
    (order) => order.assignedAuntieId === auntieId && order.status === "paid"
  )
  const ratings = assignedOrders
    .map((order) => order.review?.rating)
    .filter((rating): rating is number =>
      Boolean(
        typeof rating === "number" && Number.isFinite(rating) && rating > 0
      )
    )
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0

  return {
    avgRating: Math.round(avgRating * 10) / 10,
    completedCount: assignedOrders.length,
    reviewCount: ratings.length,
  }
}

function getAuntieRatingClassName(stats: AuntieStats) {
  if (stats.reviewCount <= 0) {
    return "text-muted-foreground"
  }

  if (stats.avgRating >= 4.8) {
    return "text-amber-500"
  }

  if (stats.avgRating >= 4.5) {
    return "text-amber-500"
  }

  return "text-amber-500"
}

export { calculateAuntieStats, getAuntieRatingClassName, type AuntieStats }
