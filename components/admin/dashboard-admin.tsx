"use client"

import { memo, useMemo, type ReactNode } from "react"
import {
  CreditCard,
  ListChecks,
  TrendUp,
  Users,
  Wallet,
} from "@phosphor-icons/react"
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { calculateAuntieStats, type AuntieStats } from "@/lib/auntie-stats"
import { AuntieProfilePopover } from "@/components/common/auntie-profile-popover"
import { type AdminDashboardSummary } from "@/lib/cms-api"
import { cn } from "@/lib/utils"
import type { CmsContent, CmsPaymentOrder, CmsTeamMember } from "@/types/cms"

// ---------------------------------------------------------------------------
// Internal Types
// ---------------------------------------------------------------------------

type DashboardOrderMetric = {
  amount: number
  count: number
}

type DashboardOrderGroups = {
  completed: DashboardOrderMetric
  pending: DashboardOrderMetric
  paid: DashboardOrderMetric
  total: DashboardOrderMetric
  unfinished: DashboardOrderMetric
}

type OrderDailyStat = {
  completed: number
  dateLabel: string
  key: string
  label: string
  pending: number
  total: number
  unfinished: number
}

type CountryOrderStat = {
  country: string
  fill: string
  orders: number
}

type DashboardTrend = {
  trend: "down" | "flat" | "up"
  trendValue: string
}

type DashboardTeamMember = CmsTeamMember & AuntieStats

type DashboardTeamStatusCounts = NonNullable<
  AdminDashboardSummary["teamStatus"]
>

// ---------------------------------------------------------------------------
// Internal Constants
// ---------------------------------------------------------------------------

const orderTrendRangeOptions = [
  { days: 7, label: "最近 7 天", value: "7" },
  { days: 14, label: "最近 14 天", value: "14" },
  { days: 30, label: "最近 30 天", value: "30" },
  { days: 90, label: "最近 90 天", value: "90" },
] as const

type OrderTrendRangeValue = (typeof orderTrendRangeOptions)[number]["value"]

const orderChartConfig = {
  completed: {
    color: "var(--chart-2)",
    label: "已完成",
  },
  pending: {
    color: "var(--chart-3)",
    label: "待处理",
  },
  total: {
    color: "var(--chart-1)",
    label: "总订单",
  },
  unfinished: {
    color: "var(--chart-4)",
    label: "待完成",
  },
} satisfies ChartConfig

const paymentStatusLabels: Record<CmsPaymentOrder["status"], string> = {
  awaiting_confirmation: "待客服确认",
  cancelled: "已取消",
  failed: "支付失败",
  paid: "已付款",
  pending: "支付中",
  unpaid: "待付款",
}

const emptyTeamMembers: CmsTeamMember[] = []

// ---------------------------------------------------------------------------
// Internal Helper Functions
// ---------------------------------------------------------------------------

function parsePaymentAmount(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ""))

  return Number.isFinite(amount) ? amount : 0
}

function getOrderTimestamp(order: CmsPaymentOrder) {
  const rawDate = order.updatedAt || order.createdAt || order.serviceDate
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0

  return Number.isFinite(timestamp) ? timestamp : 0
}

function createDashboardOrderMetric(): DashboardOrderMetric {
  return {
    amount: 0,
    count: 0,
  }
}

function addDashboardOrderMetric(
  metric: DashboardOrderMetric,
  order: CmsPaymentOrder
) {
  metric.amount += parsePaymentAmount(order.amount)
  metric.count += 1
}

function createDashboardOrderGroups(
  orders: CmsPaymentOrder[]
): DashboardOrderGroups {
  return orders.reduce<DashboardOrderGroups>(
    (groups, order) => {
      addDashboardOrderMetric(groups.total, order)

      if (
        order.status === "awaiting_confirmation" ||
        order.status === "unpaid" ||
        order.status === "pending"
      ) {
        addDashboardOrderMetric(groups.pending, order)
        return groups
      }

      if (order.status === "paid") {
        addDashboardOrderMetric(groups.paid, order)
      }

      if (isDashboardOrderCompleted(order)) {
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

function isDashboardOrderCompleted(order: CmsPaymentOrder) {
  if (order.status !== "paid") {
    return false
  }

  const serviceDate = getOrderServiceDate(order)
  if (!serviceDate) {
    return false
  }

  return serviceDate < getTodayStart()
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

function formatDashboardAmount(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`
}

function createOrderDailyStats(
  orders: CmsPaymentOrder[],
  rangeDays: number
): OrderDailyStat[] {
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

    if (
      order.status === "awaiting_confirmation" ||
      order.status === "unpaid" ||
      order.status === "pending"
    ) {
      day.pending += 1
      return
    }

    if (isDashboardOrderCompleted(order)) {
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
): DashboardTrend | undefined {
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
): CountryOrderStat[] {
  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ]
  const counts = orders.reduce<Map<string, number>>((map, order) => {
    const country = getOrderCountry(order)
    map.set(country, (map.get(country) ?? 0) + 1)
    return map
  }, new Map())

  return Array.from(counts.entries())
    .toSorted((left, right) => right[1] - left[1])
    .map(([country, ordersCount], index) => ({
      country,
      fill: palette[index % palette.length],
      orders: ordersCount,
    }))
}

function createActiveDashboardOrders(orders: CmsPaymentOrder[]) {
  return orders
    .filter((order) => {
      if (
        order.status === "awaiting_confirmation" ||
        order.status === "unpaid" ||
        order.status === "pending"
      ) {
        return true
      }

      return isDashboardOrderUnfinished(order)
    })
    .toSorted(
      (left, right) => getOrderTimestamp(right) - getOrderTimestamp(left)
    )
    .slice(0, 8)
}

function createDashboardTeamStatus(
  members: DashboardTeamMember[]
): DashboardTeamStatusCounts {
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

// ---------------------------------------------------------------------------
// Internal Sub-Components
// ---------------------------------------------------------------------------

function PaymentStatusBadge({ status }: { status: CmsPaymentOrder["status"] }) {
  return (
    <Badge className={getPaymentStatusBadgeClass(status)}>
      {paymentStatusLabels[status]}
    </Badge>
  )
}

function getPaymentStatusBadgeClass(status: CmsPaymentOrder["status"]) {
  return cn(
    "px-2 py-1 text-xs",
    status === "awaiting_confirmation" && "bg-violet-50 text-violet-700",
    status === "paid" && "bg-emerald-50 text-emerald-600",
    status === "unpaid" && "bg-amber-50 text-amber-700",
    status === "failed" && "bg-destructive/10 text-destructive",
    status === "cancelled" && "bg-muted text-muted-foreground",
    status === "pending" && "bg-blue-50 text-blue-700"
  )
}

function DashboardStatCard({
  icon,
  label,
  meta,
  tone,
  trend,
  trendValue,
  value,
}: {
  icon: ReactNode
  label: string
  meta: string
  tone: "blue" | "green" | "orange" | "purple"
  trend?: DashboardTrend["trend"]
  trendValue?: string
  value: string
}) {
  return (
    <section className="min-h-[88px] min-w-0 rounded-xl border border-border bg-card p-2.5 shadow-sm sm:p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-white",
            tone === "green" && "bg-green-400",
            tone === "orange" && "bg-orange-400",
            tone === "purple" && "bg-primary",
            tone === "blue" && "bg-sky-400"
          )}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0 [&_span]:text-[11px] [&_span]:text-muted-foreground sm:[&_span]:text-xs [&_strong]:block [&_strong]:max-w-full [&_strong]:truncate [&_strong]:text-lg [&_strong]:leading-tight [&_strong]:font-semibold [&_strong]:text-foreground sm:[&_strong]:text-xl">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
        {trend && trendValue ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600",
              trend === "down" && "bg-destructive/10 text-destructive",
              trend === "flat" && "bg-muted text-muted-foreground"
            )}
          >
            {trend === "flat" ? null : (
              <TrendUp
                className={cn(trend === "down" && "rotate-180")}
                size={13}
                weight="bold"
              />
            )}
            {trendValue}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 truncate text-[11px] text-muted-foreground sm:text-xs">
        {meta}
      </p>
    </section>
  )
}

const DashboardOrderLineChart = memo(function DashboardOrderLineChart({
  rangeLabel,
  stats,
}: {
  rangeLabel: string
  stats: OrderDailyStat[]
}) {
  const hasData = stats.some((item) => item.total > 0)
  const tickLabels = useMemo(
    () => new Map(stats.map((item) => [item.key, item.label])),
    [stats]
  )

  if (!hasData) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground">
        {rangeLabel}暂无订单数据
      </div>
    )
  }

  return (
    <ChartContainer
      className="h-[260px] w-full overflow-hidden"
      config={orderChartConfig}
    >
      <LineChart
        accessibilityLayer
        data={stats}
        margin={{ bottom: 4, left: -10, right: 16, top: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          allowDuplicatedCategory={false}
          axisLine={false}
          dataKey="key"
          minTickGap={18}
          tickLine={false}
          tickFormatter={(value) => tickLabels.get(String(value)) ?? ""}
          tickMargin={10}
        />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
        <ChartTooltip
          allowEscapeViewBox={{ x: false, y: false }}
          content={
            <ChartTooltipContent
              className="w-[170px]"
              indicator="line"
              labelFormatter={(_, payload) => {
                const label = payload[0]?.payload?.dateLabel

                return typeof label === "string" ? label : ""
              }}
            />
          }
          cursor={{
            stroke: "var(--border)",
            strokeDasharray: "4 4",
            strokeWidth: 1.5,
          }}
          offset={12}
          wrapperStyle={{ maxWidth: 170, pointerEvents: "none" }}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="total"
          dot={false}
          isAnimationActive={false}
          name="总订单"
          stroke="var(--color-total)"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          dataKey="pending"
          dot={false}
          isAnimationActive={false}
          name="待处理"
          stroke="var(--color-pending)"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          dataKey="unfinished"
          dot={false}
          isAnimationActive={false}
          name="待完成"
          stroke="var(--color-unfinished)"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          dataKey="completed"
          dot={false}
          isAnimationActive={false}
          name="已完成"
          stroke="var(--color-completed)"
          strokeWidth={2.5}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  )
})

const DashboardCountryChart = memo(function DashboardCountryChart({
  stats,
}: {
  stats: CountryOrderStat[]
}) {
  const chartConfig = stats.reduce<ChartConfig>((config, stat, index) => {
    config[`country-${index}`] = {
      color: stat.fill,
      label: stat.country,
    }
    return config
  }, {})

  if (!stats.length) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground">
        暂无订单国家数据
      </div>
    )
  }

  return (
    <ChartContainer className="mx-auto h-[260px] w-full" config={chartConfig}>
      <PieChart accessibilityLayer>
        <ChartTooltip
          content={<ChartTooltipContent hideLabel nameKey="country" />}
        />
        <Pie
          data={stats}
          dataKey="orders"
          innerRadius={58}
          isAnimationActive={false}
          nameKey="country"
        >
          {stats.map((entry) => (
            <Cell fill={entry.fill} key={entry.country} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="country" />} />
      </PieChart>
    </ChartContainer>
  )
})

function DashboardActiveOrdersTable({ orders }: { orders: CmsPaymentOrder[] }) {
  return (
    <div className="max-w-full overflow-hidden rounded-xl border border-border bg-muted/50 [&_[data-slot=table-cell]]:px-2.5 [&_[data-slot=table-cell]]:py-1.5 [&_[data-slot=table-cell]]:text-xs [&_[data-slot=table-cell]]:leading-tight [&_[data-slot=table-container]]:max-w-full [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-head]]:h-7 [&_[data-slot=table-head]]:px-2.5 [&_[data-slot=table-head]]:text-[11px] [&_[data-slot=table-row]]:h-9">
      <Table className="min-w-[640px] text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>订单号</TableHead>
            <TableHead>客户</TableHead>
            <TableHead>服务</TableHead>
            <TableHead>日期</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.orderId}>
              <TableCell className="font-semibold">{order.orderId}</TableCell>
              <TableCell>{order.customerName || "未填写客户"}</TableCell>
              <TableCell className="max-w-[220px]">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium">
                    {order.serviceType || "服务类型待确认"}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="truncate text-muted-foreground">
                    {order.serviceArea || "区域待确认"}
                  </span>
                </div>
              </TableCell>
              <TableCell>{order.serviceDate || "待确认"}</TableCell>
              <TableCell>{order.amount || "待报价"}</TableCell>
              <TableCell>
                {order.status === "awaiting_confirmation" ||
                order.status === "unpaid" ||
                order.status === "pending" ? (
                  <PaymentStatusBadge status={order.status} />
                ) : (
                  <Badge className={getPaymentStatusBadgeClass("pending")}>
                    待完成
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function DashboardTeamStatus({
  counts,
  members,
  token,
}: {
  counts: DashboardTeamStatusCounts
  members: DashboardTeamMember[]
  token: string
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="mb-3 mb-4 flex flex-col items-start justify-between gap-3 sm:mb-4 sm:mb-5 sm:flex-row sm:items-start sm:gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground sm:[&_h2]:text-lg [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted-foreground sm:[&_p]:text-sm">
        <div>
          <h2>团队状态</h2>
          <p>
            显示 {members.length}/{counts.total} 位
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          <Badge
            className="h-6 rounded-full px-2 py-0.5 text-[11px]"
            variant="secondary"
          >
            <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
            空闲 {counts.available}
          </Badge>
          <Badge
            className="h-6 rounded-full px-2 py-0.5 text-[11px]"
            variant="secondary"
          >
            <span className="size-2 shrink-0 rounded-full bg-blue-500" />
            服务中 {counts.onTask}
          </Badge>
          <Badge
            className="h-6 rounded-full px-2 py-0.5 text-[11px]"
            variant="secondary"
          >
            <span className="size-2 shrink-0 rounded-full bg-gray-400" />
            休息/请假 {counts.resting}
          </Badge>
        </div>
      </div>
      {members.length ? (
        <div className="flex max-h-40 flex-wrap content-start gap-2 overflow-y-auto pr-1">
          {members.map((member) => (
            <AuntieProfilePopover
              key={member.id}
              member={member}
              stats={member}
              token={token}
            />
          ))}
        </div>
      ) : members.length ? (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
          暂无空闲阿姨
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
          暂无团队成员数据
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function DashboardAdmin({
  chartRange,
  content,
  dashboardSummary,
  onTrendRangeChange,
  token,
}: {
  chartRange: number
  content: CmsContent
  dashboardSummary?: AdminDashboardSummary
  onTrendRangeChange: (range: number) => void
  token: string
}) {
  const orderTrendRange = String(chartRange) as OrderTrendRangeValue
  const orderTrendOption =
    orderTrendRangeOptions.find((option) => option.value === orderTrendRange) ??
    orderTrendRangeOptions[1]
  const fallbackTeamMembers = useMemo<DashboardTeamMember[]>(
    () =>
      (content.teamMembers ?? emptyTeamMembers).map((member) => {
        const stats = calculateAuntieStats(
          member.id,
          content.paymentOrders ?? []
        )

        return {
          ...member,
          ...stats,
          completedCount: stats.completedCount,
          rating: stats.avgRating,
        }
      }),
    [content.paymentOrders, content.teamMembers]
  )

  const fallbackOrderGroups = useMemo(
    () => createDashboardOrderGroups(content.paymentOrders),
    [content.paymentOrders]
  )
  const fallbackOrderDailyStats = useMemo(
    () => createOrderDailyStats(content.paymentOrders, orderTrendOption.days),
    [content.paymentOrders, orderTrendOption.days]
  )
  const fallbackCountryDistribution = useMemo(
    () => createOrderCountryDistribution(content.paymentOrders),
    [content.paymentOrders]
  )
  const fallbackRecentTrends = useMemo(
    () => createRecentOrderTrends(content.paymentOrders),
    [content.paymentOrders]
  )
  const fallbackActiveOrders = useMemo(
    () => createActiveDashboardOrders(content.paymentOrders),
    [content.paymentOrders]
  )
  const teamMembers = dashboardSummary?.teamMembers ?? fallbackTeamMembers
  const teamStatus =
    dashboardSummary?.teamStatus ?? createDashboardTeamStatus(teamMembers)
  const orderGroups = dashboardSummary?.orderGroups ?? fallbackOrderGroups
  const orderDailyStats =
    dashboardSummary?.orderDailyStats[String(orderTrendOption.days)] ??
    fallbackOrderDailyStats
  const countryDistribution =
    dashboardSummary?.countryDistribution ?? fallbackCountryDistribution
  const recentTrends = dashboardSummary?.recentTrends ?? fallbackRecentTrends
  const activeOrders = dashboardSummary?.activeOrders ?? fallbackActiveOrders
  const activeTeamCount = useMemo(() => teamStatus.active, [teamStatus.active])

  const paidRevenue = orderGroups.paid.amount
  const totalRevenue = orderGroups.total.amount
  const completionRate = orderGroups.total.count
    ? Math.round((orderGroups.completed.count / orderGroups.total.count) * 100)
    : 0

  return (
    <div className="grid min-w-0 gap-3 gap-4 sm:gap-4 sm:gap-6">
      <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-2 sm:gap-3">
        <DashboardStatCard
          icon={<Wallet size={21} weight="fill" />}
          label="总收入"
          meta={`订单金额 ${formatDashboardAmount(totalRevenue)}`}
          tone="green"
          trend={recentTrends.revenueTrend?.trend}
          trendValue={recentTrends.revenueTrend?.trendValue}
          value={formatDashboardAmount(paidRevenue)}
        />
        <DashboardStatCard
          icon={<CreditCard size={21} weight="fill" />}
          label="总订单"
          meta={`完成率 ${completionRate}%`}
          tone="orange"
          trend={recentTrends.orderTrend?.trend}
          trendValue={recentTrends.orderTrend?.trendValue}
          value={String(orderGroups.total.count)}
        />
        <DashboardStatCard
          icon={<ListChecks size={21} weight="fill" />}
          label="待处理订单"
          meta={`${orderGroups.pending.count} 笔未付款 · ${orderGroups.unfinished.count} 笔待服务`}
          tone="purple"
          value={String(
            orderGroups.pending.count + orderGroups.unfinished.count
          )}
        />
        <DashboardStatCard
          icon={<Users size={21} weight="fill" />}
          label="在岗团队"
          meta={`空闲 ${teamStatus.available} 人 · 服务中 ${teamStatus.onTask} 人`}
          tone="blue"
          value={`${activeTeamCount}/${teamStatus.total}`}
        />
      </div>

      <section className="min-h-0 min-w-0 rounded-xl border border-border bg-card p-3 p-4 shadow-sm sm:p-4 sm:p-5">
        <DashboardTeamStatus
          counts={teamStatus}
          members={teamMembers}
          token={token}
        />
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="min-h-0 min-h-[340px] min-w-0 rounded-xl border border-border bg-card p-3 p-4 shadow-sm sm:p-4 sm:p-5 lg:col-start-1">
          <div className="mb-3 mb-4 flex items-start justify-between gap-3 sm:mb-4 sm:mb-5 sm:gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground sm:[&_h2]:text-lg [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted-foreground sm:[&_p]:text-sm">
            <div>
              <h2>订单趋势</h2>
              <p>{orderTrendOption.label}订单创建和状态变化趋势</p>
            </div>
            <Select
              onValueChange={(value) => onTrendRangeChange(Number(value))}
              value={orderTrendRange}
            >
              <SelectTrigger className="h-8 w-[118px] shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {orderTrendRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DashboardOrderLineChart
            rangeLabel={orderTrendOption.label}
            stats={orderDailyStats}
          />
        </section>
        <section className="min-h-0 min-h-[340px] min-w-0 rounded-xl border border-border bg-card p-3 p-4 shadow-sm sm:p-4 sm:p-5 lg:col-start-2">
          <div className="mb-3 mb-4 flex items-start justify-between gap-3 sm:mb-4 sm:mb-5 sm:gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground sm:[&_h2]:text-lg [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted-foreground sm:[&_p]:text-sm">
            <div>
              <h2>订单分布</h2>
              <p>按服务地区统计订单</p>
            </div>
          </div>
          <DashboardCountryChart stats={countryDistribution} />
        </section>
      </div>

      <section className="min-h-0 min-w-0 rounded-xl border border-border bg-card p-3 p-4 shadow-sm sm:p-4 sm:p-5">
        <div className="mb-3 mb-4 flex items-start justify-between gap-3 sm:mb-4 sm:mb-5 sm:gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground sm:[&_h2]:text-lg [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted-foreground sm:[&_p]:text-sm">
          <div>
            <h2>待处理订单</h2>
            <p>未支付订单和已付款但服务尚未完成的订单</p>
          </div>
        </div>
        {activeOrders.length ? (
          <DashboardActiveOrdersTable orders={activeOrders} />
        ) : (
          <div className="rounded-xl border border-border bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
            当前没有未支付或待完成订单。
          </div>
        )}
      </section>
    </div>
  )
}
