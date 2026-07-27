import {
  getActiveAssignedOrderCount,
  isPaymentOrderCompleted,
} from "@/lib/auntie-assignment"
import { calculateAuntieStats, type AuntieStats } from "@/lib/auntie-stats"
import type { CmsContent, CmsPaymentOrder, CmsTeamMember } from "@/types/cms"

type AdminDashboardOrderMetric = {
  amount: number
  count: number
}

type AdminDashboardOrderGroups = {
  completed: AdminDashboardOrderMetric
  pending: AdminDashboardOrderMetric
  paid: AdminDashboardOrderMetric
  total: AdminDashboardOrderMetric
  unfinished: AdminDashboardOrderMetric
}

type AdminDashboardDailyStat = {
  completed: number
  dateLabel: string
  key: string
  label: string
  pending: number
  total: number
  unfinished: number
}

type AdminDashboardDistributionStat = {
  country: string
  fill: string
  orders: number
}

type AdminDashboardTrend = {
  trend: "down" | "flat" | "up"
  trendValue: string
}

type AdminAuntieStats = AuntieStats & {
  activeAssignedCount: number
}

type AdminAuntieStatsMap = Record<string, AdminAuntieStats>

type AdminDashboardTeamMember = CmsTeamMember & AdminAuntieStats

type AdminDashboardTeamStatus = {
  active: number
  available: number
  onTask: number
  resting: number
  total: number
}

type AdminDashboardSummary = {
  activeOrders: CmsPaymentOrder[]
  countryDistribution: AdminDashboardDistributionStat[]
  orderDailyStats: Record<string, AdminDashboardDailyStat[]>
  orderGroups: AdminDashboardOrderGroups
  recentTrends: {
    orderTrend?: AdminDashboardTrend
    revenueTrend?: AdminDashboardTrend
  }
  teamStatus: AdminDashboardTeamStatus
  teamMembers: AdminDashboardTeamMember[]
}

const dashboardTeamPreviewLimit = 24
const orderDistributionPalette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function createDashboardSummary(
  content: CmsContent,
  chartRange?: number,
  parts?: "chart"
): AdminDashboardSummary {
  const orders = content.paymentOrders ?? []
  const days = chartRange ?? 14

  if (parts === "chart") {
    return {
      activeOrders: [],
      countryDistribution: [],
      orderDailyStats: {
        [String(days)]: createOrderDailyStats(orders, days),
      },
      orderGroups: {
        completed: createDashboardOrderMetric(),
        pending: createDashboardOrderMetric(),
        paid: createDashboardOrderMetric(),
        total: createDashboardOrderMetric(),
        unfinished: createDashboardOrderMetric(),
      },
      recentTrends: {},
      teamStatus: {
        active: 0,
        available: 0,
        onTask: 0,
        resting: 0,
        total: 0,
      },
      teamMembers: [],
    }
  }

  const members = content.teamMembers ?? []
  const previewMembers = createDashboardTeamPreview(members)
  const auntieStats = createAuntieStatsMap(orders, previewMembers)

  return {
    activeOrders: createActiveDashboardOrders(orders),
    countryDistribution: createOrderCountryDistribution(orders),
    orderDailyStats: {
      [String(days)]: createOrderDailyStats(orders, days),
    },
    orderGroups: createDashboardOrderGroups(orders),
    recentTrends: createRecentOrderTrends(orders),
    teamStatus: createDashboardTeamStatus(members),
    teamMembers: previewMembers.map((member) => {
      const stats = auntieStats[member.id] ?? createEmptyAuntieStats()

      return {
        ...member,
        ...stats,
        completedCount: stats.completedCount,
        rating: stats.avgRating || member.rating,
        // Strip detail fields — fetched on-demand via popover
        phone: undefined,
        serviceAreas: undefined,
        currentOrder: undefined,
        joinedAt: undefined,
      }
    }),
  }
}

function createDashboardTeamPreview(members: CmsTeamMember[]) {
  const statusRank: Record<CmsTeamMember["status"], number> = {
    available: 0,
    "on-task": 1,
    "on-leave": 2,
    "off-duty": 3,
  }

  return [...members]
    .sort((left, right) => {
      const rankDiff = statusRank[left.status] - statusRank[right.status]

      return rankDiff || left.name.localeCompare(right.name, "zh-CN")
    })
    .slice(0, dashboardTeamPreviewLimit)
}

function createDashboardTeamStatus(
  members: CmsTeamMember[]
): AdminDashboardTeamStatus {
  const available = members.filter(
    (member) => member.status === "available"
  ).length
  const onTask = members.filter((member) => member.status === "on-task").length
  const resting = members.filter(
    (member) => member.status === "off-duty" || member.status === "on-leave"
  ).length

  return {
    active: available + onTask,
    available,
    onTask,
    resting,
    total: members.length,
  }
}

function createAuntieStatsMap(
  orders: CmsPaymentOrder[],
  members: CmsTeamMember[] = []
): AdminAuntieStatsMap {
  const auntieIds = new Set(members.map((member) => member.id))

  orders.forEach((order) => {
    if (order.assignedAuntieId) {
      auntieIds.add(order.assignedAuntieId)
    }
  })

  return Array.from(auntieIds).reduce<AdminAuntieStatsMap>((map, auntieId) => {
    map[auntieId] = {
      ...calculateAuntieStats(auntieId, orders),
      activeAssignedCount: getActiveAssignedOrderCount(auntieId, orders),
    }
    return map
  }, {})
}

function createEmptyAuntieStats(): AdminAuntieStats {
  return {
    activeAssignedCount: 0,
    avgRating: 0,
    completedCount: 0,
    reviewCount: 0,
  }
}

function parsePaymentAmount(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ""))

  return Number.isFinite(amount) ? amount : 0
}

function getOrderTimestamp(order: CmsPaymentOrder) {
  const rawDate = order.updatedAt || order.createdAt || order.serviceDate
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0

  return Number.isFinite(timestamp) ? timestamp : 0
}

function createDashboardOrderMetric(): AdminDashboardOrderMetric {
  return {
    amount: 0,
    count: 0,
  }
}

function addDashboardOrderMetric(
  metric: AdminDashboardOrderMetric,
  order: CmsPaymentOrder
) {
  metric.amount += parsePaymentAmount(order.amount)
  metric.count += 1
}

function createDashboardOrderGroups(
  orders: CmsPaymentOrder[]
): AdminDashboardOrderGroups {
  return orders.reduce<AdminDashboardOrderGroups>(
    (groups, order) => {
      addDashboardOrderMetric(groups.total, order)

      if (order.status === "unpaid" || order.status === "pending") {
        addDashboardOrderMetric(groups.pending, order)
        return groups
      }

      if (order.status === "paid") {
        addDashboardOrderMetric(groups.paid, order)
      }

      if (isPaymentOrderCompleted(order)) {
        addDashboardOrderMetric(groups.completed, order)
        return groups
      }

      if (isDashboardOrderUnfinished(order)) {
        addDashboardOrderMetric(groups.unfinished, order)
      }

      return groups
    },
    {
      completed: createDashboardOrderMetric(),
      pending: createDashboardOrderMetric(),
      paid: createDashboardOrderMetric(),
      total: createDashboardOrderMetric(),
      unfinished: createDashboardOrderMetric(),
    }
  )
}

function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function getTodayStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function getOrderServiceDate(order: CmsPaymentOrder) {
  const date = order.serviceDate ? new Date(order.serviceDate) : null

  if (!date || Number.isNaN(date.getTime())) {
    return null
  }

  date.setHours(0, 0, 0, 0)
  return date
}

function isDashboardOrderUnfinished(order: CmsPaymentOrder) {
  if (order.status !== "paid") {
    return false
  }

  const serviceDate = getOrderServiceDate(order)
  if (!serviceDate) {
    return true
  }

  return serviceDate >= getTodayStart()
}

function createOrderDailyStats(
  orders: CmsPaymentOrder[],
  rangeDays: number
): AdminDashboardDailyStat[] {
  const today = new Date()
  const days = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(today.getDate() - (rangeDays - 1 - index))

    return {
      completed: 0,
      dateLabel: date.toLocaleDateString("zh-CN", {
        day: "numeric",
        month: "short",
        weekday: "short",
      }),
      key: formatDateKey(date),
      label:
        rangeDays > 14
          ? date.toLocaleDateString("zh-CN", {
              day: "numeric",
              month: "numeric",
            })
          : date.toLocaleDateString("zh-CN", { weekday: "short" }),
      pending: 0,
      total: 0,
      unfinished: 0,
    }
  })
  const dayMap = new Map(days.map((day) => [day.key, day]))

  orders.forEach((order) => {
    const rawDate = order.updatedAt || order.createdAt || order.serviceDate
    const date = rawDate ? new Date(rawDate) : null

    if (!date || Number.isNaN(date.getTime())) {
      return
    }

    const day = dayMap.get(formatDateKey(date))

    if (!day) {
      return
    }

    day.total += 1

    if (order.status === "unpaid" || order.status === "pending") {
      day.pending += 1
      return
    }

    if (isPaymentOrderCompleted(order)) {
      day.completed += 1
      return
    }

    if (isDashboardOrderUnfinished(order)) {
      day.unfinished += 1
    }
  })

  return days.map(
    ({ completed, dateLabel, key, label, pending, total, unfinished }) => ({
      completed,
      dateLabel,
      key,
      label,
      pending,
      total,
      unfinished,
    })
  )
}

function formatTrendPercent(value: number) {
  const absolute = Math.abs(value)
  const rounded =
    absolute >= 10 ? Math.round(absolute) : Number(absolute.toFixed(1))

  return `${value > 0 ? "+" : "-"}${rounded}%`
}

function createDashboardTrend(
  current: number,
  previous: number
): AdminDashboardTrend | undefined {
  if (current === previous) {
    return current > 0 ? { trend: "flat", trendValue: "持平" } : undefined
  }

  if (previous <= 0) {
    return current > 0 ? { trend: "up", trendValue: "新增" } : undefined
  }

  const delta = ((current - previous) / previous) * 100

  return {
    trend: delta > 0 ? "up" : "down",
    trendValue: formatTrendPercent(delta),
  }
}

function createRecentOrderTrends(orders: CmsPaymentOrder[]) {
  const dayMs = 86_400_000
  const now = Date.now()
  const currentStart = now - 14 * dayMs
  const previousStart = now - 28 * dayMs
  const current = createDashboardOrderMetric()
  const previous = createDashboardOrderMetric()

  orders.forEach((order) => {
    const timestamp = getOrderTimestamp(order)

    if (!timestamp || timestamp < previousStart || timestamp > now) {
      return
    }

    const bucket = timestamp >= currentStart ? current : previous
    bucket.count += 1

    if (order.status === "paid") {
      bucket.amount += parsePaymentAmount(order.amount)
    }
  })

  return {
    orderTrend: createDashboardTrend(current.count, previous.count),
    revenueTrend: createDashboardTrend(current.amount, previous.amount),
  }
}

function getOrderCountry(order: CmsPaymentOrder) {
  const parts = order.serviceArea
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.at(-1) || "未填写"
}

function createOrderCountryDistribution(
  orders: CmsPaymentOrder[]
): AdminDashboardDistributionStat[] {
  const counts = orders.reduce<Map<string, number>>((map, order) => {
    const country = getOrderCountry(order)
    map.set(country, (map.get(country) ?? 0) + 1)
    return map
  }, new Map())

  return Array.from(counts.entries())
    .toSorted((left, right) => right[1] - left[1])
    .map(([country, ordersCount], index) => ({
      country,
      fill: orderDistributionPalette[index % orderDistributionPalette.length],
      orders: ordersCount,
    }))
}

function createActiveDashboardOrders(orders: CmsPaymentOrder[]) {
  return orders
    .filter((order) => {
      if (order.status === "unpaid" || order.status === "pending") {
        return true
      }

      return isDashboardOrderUnfinished(order)
    })
    .toSorted(
      (left, right) => getOrderTimestamp(right) - getOrderTimestamp(left)
    )
    .slice(0, 8)
}

export { createAuntieStatsMap, createDashboardSummary }

export type {
  AdminAuntieStats,
  AdminAuntieStatsMap,
  AdminDashboardDailyStat,
  AdminDashboardDistributionStat,
  AdminDashboardOrderGroups,
  AdminDashboardOrderMetric,
  AdminDashboardSummary,
  AdminDashboardTeamMember,
  AdminDashboardTeamStatus,
  AdminDashboardTrend,
}
