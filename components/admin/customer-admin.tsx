"use client"

import { useEffect, useState } from "react"
import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  GearSix,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { RecordsPanel } from "@/components/admin/admin-shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
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
import {
  fetchAdminWecomCustomers,
  syncAdminWecomCustomers,
  updateAdminWecomSyncSettings,
} from "@/lib/cms-api"
import type {
  WecomCustomer,
  WecomCustomerPage,
  WecomSyncSettings,
} from "@/lib/wecom-types"
import { cn } from "@/lib/utils"

const pageSizeOptions = [10, 20, 50, 100]
const syncIntervalOptions = [
  { label: "每 15 分钟", value: 15 },
  { label: "每 30 分钟", value: 30 },
  { label: "每 1 小时", value: 60 },
  { label: "每 2 小时", value: 120 },
  { label: "每 4 小时", value: 240 },
  { label: "每 6 小时", value: 360 },
  { label: "每 12 小时", value: 720 },
]

export function CustomerAdmin({ token }: { token: string }) {
  const [data, setData] = useState<WecomCustomerPage | null>(null)
  const [queryInput, setQueryInput] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [scheduleMode, setScheduleMode] =
    useState<WecomSyncSettings["mode"]>("disabled")
  const [scheduleIntervalMinutes, setScheduleIntervalMinutes] = useState(60)
  const [scheduleTime, setScheduleTime] = useState("02:00")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (queryInput === query) return

    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setPage(1)
      setQuery(queryInput)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, queryInput])

  useEffect(() => {
    let isMounted = true
    fetchAdminWecomCustomers(token, { page, pageSize, query })
      .then((result) => {
        if (!isMounted) return
        setData(result)
        setPage(result.pagination.page)
        setScheduleMode(result.settings.mode)
        setScheduleIntervalMinutes(result.settings.intervalMinutes)
        setScheduleTime(
          formatTime(result.settings.hour, result.settings.minute)
        )
      })
      .catch((error) => {
        if (isMounted) {
          toast.error(
            error instanceof Error ? error.message : "客户数据加载失败"
          )
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [page, pageSize, query, reloadKey, token])

  async function handleSync() {
    setIsSyncing(true)
    try {
      const result = await syncAdminWecomCustomers(token)
      setData((current) =>
        current ? { ...current, settings: result.settings } : current
      )
      setIsLoading(true)
      setPage(1)
      setReloadKey((value) => value + 1)
      toast.success(`企业微信客户同步完成，共 ${result.settings.lastCount} 条`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "企业微信同步失败")
      setReloadKey((value) => value + 1)
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleSaveSchedule() {
    const [hour, minute] = scheduleTime.split(":").map(Number)
    setIsSavingSchedule(true)
    try {
      const result = await updateAdminWecomSyncSettings(token, {
        hour,
        intervalMinutes: scheduleIntervalMinutes,
        minute,
        mode: scheduleMode,
      })
      setData((current) =>
        current ? { ...current, settings: result.settings } : current
      )
      toast.success(
        scheduleMode === "disabled" ? "自动同步已关闭" : "同步计划已保存"
      )
      setIsScheduleOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "同步配置保存失败")
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const settings = data?.settings
  const pagination = data?.pagination

  function handleScheduleOpenChange(open: boolean) {
    setIsScheduleOpen(open)
    if (open && settings) {
      setScheduleMode(settings.mode)
      setScheduleIntervalMinutes(settings.intervalMinutes)
      setScheduleTime(formatTime(settings.hour, settings.minute))
    }
  }

  return (
    <div>
      <Dialog onOpenChange={handleScheduleOpenChange} open={isScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>同步设置</DialogTitle>
            <DialogDescription>
              选择按固定间隔同步，或在每天指定时间同步企业微信客户数据。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <label className="grid gap-2 text-sm font-medium">
              <span>同步模式</span>
              <Select
                disabled={!settings?.configured}
                onValueChange={(value) =>
                  setScheduleMode(value as WecomSyncSettings["mode"])
                }
                value={scheduleMode}
              >
                <SelectTrigger className="h-10 rounded-md">
                  <SelectValue placeholder="选择同步模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">关闭自动同步</SelectItem>
                  <SelectItem value="interval">定时同步</SelectItem>
                  <SelectItem value="daily">每日同步</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs font-normal text-muted-foreground">
                容器重启后会自动恢复同步计划
              </span>
            </label>

            {scheduleMode === "interval" ? (
              <label className="grid gap-2 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Clock className="text-muted-foreground" size={16} />
                  同步间隔
                </span>
                <Select
                  disabled={!settings?.configured}
                  onValueChange={(value) =>
                    setScheduleIntervalMinutes(Number(value))
                  }
                  value={String(scheduleIntervalMinutes)}
                >
                  <SelectTrigger className="h-10 rounded-md">
                    <SelectValue placeholder="选择同步间隔" />
                  </SelectTrigger>
                  <SelectContent>
                    {syncIntervalOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            ) : null}

            {scheduleMode === "daily" ? (
              <label className="grid gap-2 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Clock className="text-muted-foreground" size={16} />
                  每日同步时间
                </span>
                <input
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  disabled={!settings?.configured}
                  onChange={(event) => setScheduleTime(event.target.value)}
                  type="time"
                  value={scheduleTime}
                />
                <span className="text-xs font-normal text-muted-foreground">
                  时区：Asia/Shanghai（北京时间）
                </span>
              </label>
            ) : null}

            {!settings?.configured ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                请先在服务器配置 WECOM_CORP_ID 和 WECOM_CORP_SECRET。
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              onClick={() => handleScheduleOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              disabled={isSavingSchedule || !settings?.configured}
              onClick={handleSaveSchedule}
              type="button"
              variant="brand"
            >
              {isSavingSchedule ? "保存中..." : "保存设置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecordsPanel
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              disabled={!settings}
              onClick={() => handleScheduleOpenChange(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <GearSix size={14} weight="bold" />
              同步设置
            </Button>
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              disabled={isSyncing || !settings?.configured}
              onClick={handleSync}
              size="sm"
              type="button"
              variant="brand"
            >
              <ArrowsClockwise
                className={cn(isSyncing && "animate-spin")}
                size={14}
                weight="bold"
              />
              {isSyncing ? "同步中" : "立即同步"}
            </Button>
          </div>
        }
        count={pagination?.totalCount ?? 0}
        countExtra={
          settings?.lastStatus === "success" ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle size={14} weight="fill" />
              同步成功
            </span>
          ) : null
        }
        description={
          settings?.configured ? getSyncSummary(settings) : undefined
        }
        query={queryInput}
        searchPlaceholder="搜索客户、地区、标签或添加人"
        setQuery={setQueryInput}
        title="客户列表"
      >
        <Table className="min-w-[1440px] text-xs [&_td]:px-2 [&_th]:px-2">
          <TableHeader>
            <TableRow>
              <TableHead>客户名称@客户类型</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>客户企业</TableHead>
              <TableHead>学员区分</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>对接阿姨</TableHead>
              <TableHead>添加人（添加人账号）</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>备注手机号</TableHead>
              <TableHead>添加时间</TableHead>
              <TableHead>客户来源</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={11}
                >
                  正在加载客户数据...
                </TableCell>
              </TableRow>
            ) : data?.customers.length ? (
              data.customers.map((customer) => (
                <CustomerRow
                  customer={customer}
                  key={customer.relationId}
                  tagColorMap={data.tagColors}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={11}
                >
                  {settings?.configured
                    ? "暂无客户数据，请先执行同步"
                    : "请先在服务器配置企业微信环境变量"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <CustomerPagination
          onPageChange={(value) => {
            setIsLoading(true)
            setPage(value)
          }}
          onPageSizeChange={(value) => {
            setIsLoading(true)
            setPageSize(value)
            setPage(1)
          }}
          page={pagination?.page ?? page}
          pageSize={pagination?.pageSize ?? pageSize}
          totalCount={pagination?.totalCount ?? 0}
          totalPages={pagination?.totalPages ?? 1}
        />
      </RecordsPanel>
    </div>
  )
}

function CustomerRow({
  customer,
  tagColorMap,
}: {
  customer: WecomCustomer
  tagColorMap: Record<string, number>
}) {
  return (
    <TableRow className="[&>td]:h-9 [&>td]:py-1">
      <TableCell>
        <div className="flex items-center gap-2">
          {customer.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- WeCom supplies remote avatar URLs.
            <img
              alt=""
              className="size-7 rounded-full bg-muted object-cover"
              loading="lazy"
              src={customer.avatar}
            />
          ) : (
            <span className="size-7 rounded-full bg-muted" />
          )}
          <span className="font-medium text-foreground">
            {customer.nameAndType || "-"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span
          aria-label={getGenderLabel(customer.gender)}
          className={cn(
            "inline-block min-w-6 text-center text-xl font-semibold",
            customer.gender === "male" && "text-blue-600",
            customer.gender === "female" && "text-pink-500",
            customer.gender === "unknown" && "text-muted-foreground"
          )}
          title={getGenderLabel(customer.gender)}
        >
          {customer.gender === "male"
            ? "♂"
            : customer.gender === "female"
              ? "♀"
              : "•"}
        </span>
      </TableCell>
      <CompactCell
        value={
          customer.corpName && customer.position
            ? `${customer.corpName}（${customer.position}）`
            : customer.corpName || customer.position
        }
      />
      <TagCell
        colorMap={tagColorMap}
        tone="student"
        value={customer.studentType}
      />
      <TagCell colorMap={tagColorMap} tone="region" value={customer.region} />
      <TagCell colorMap={tagColorMap} tone="auntie" value={customer.auntie} />
      <TableCell>
        <div className="flex max-w-64 items-center gap-1 overflow-hidden">
          <span className="shrink-0 font-medium text-foreground">
            {customer.followUser || "-"}
          </span>
          <span className="truncate text-muted-foreground">
            （{customer.followUserId || "-"}）
          </span>
        </div>
      </TableCell>
      <CompactCell value={customer.description} />
      <CompactCell value={customer.remarkMobiles} />
      <CompactCell value={customer.addTime} />
      <CompactCell value={customer.addWay} />
    </TableRow>
  )
}

function CompactCell({ value }: { value: string }) {
  return (
    <TableCell className="max-w-56 truncate" title={value}>
      {value || "-"}
    </TableCell>
  )
}

function TagCell({
  colorMap,
  tone,
  value,
}: {
  colorMap: Record<string, number>
  tone: "auntie" | "region" | "student"
  value: string
}) {
  const tags = value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

  return (
    <TableCell title={value}>
      {tags.length ? (
        <div className="flex max-w-52 flex-nowrap gap-1 overflow-hidden">
          {tags.map((tag, index) => (
            <Badge
              className={cn(
                "h-6 shrink-0 rounded px-2 py-0 text-xs font-medium",
                tagColorClasses[
                  (colorMap[`${tone}:${tag}`] ?? index) % tagColorClasses.length
                ]
              )}
              key={`${tag}-${index}`}
              variant="secondary"
            >
              {tag}
            </Badge>
          ))}
        </div>
      ) : (
        "-"
      )}
    </TableCell>
  )
}

const tagColorClasses = [
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
  "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300",
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300",
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300",
  "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/30 dark:bg-fuchsia-400/10 dark:text-fuchsia-300",
]

function CustomerPagination({
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  totalCount,
  totalPages,
}: {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}) {
  const start = totalCount ? (page - 1) * pageSize + 1 : 0
  const end = Math.min(page * pageSize, totalCount)
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          onValueChange={(value) => onPageSizeChange(Number(value))}
          value={String(pageSize)}
        >
          <SelectTrigger className="h-8 w-[76px] rounded-md px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <span>
          Showing {start}-{end} of {totalCount}
        </span>
        <Button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          上一页
        </Button>
        <span className="min-w-12 text-center">
          {page}/{totalPages}
        </span>
        <Button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          下一页
        </Button>
      </div>
    </div>
  )
}

function getSyncSummary(settings?: WecomSyncSettings) {
  if (!settings) return "正在读取同步状态..."
  if (!settings.configured) {
    return "需要在服务器设置 WECOM_CORP_ID 和 WECOM_CORP_SECRET。"
  }
  const lastSync = settings.lastCompletedAt
    ? new Date(settings.lastCompletedAt).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      })
    : "尚未完成同步"
  const nextSync = settings.nextRunAt
    ? new Date(settings.nextRunAt).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      })
    : "未开启定时同步"
  const schedule =
    settings.mode === "interval"
      ? `每隔 ${formatInterval(settings.intervalMinutes)}同步`
      : settings.mode === "daily"
        ? `每日 ${formatTime(settings.hour, settings.minute)} 同步`
        : "自动同步已关闭"
  const nextRun = settings.mode === "disabled" ? "" : ` · 下次执行：${nextSync}`
  return `上次完成：${lastSync} · 客户关系 ${settings.lastCount} 条 · ${schedule}${nextRun}`
}

function formatInterval(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`
  return `${minutes / 60} 小时`
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function getGenderLabel(gender: WecomCustomer["gender"]) {
  return gender === "male" ? "男" : gender === "female" ? "女" : "未知"
}
