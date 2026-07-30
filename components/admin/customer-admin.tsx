"use client"

import { useEffect, useState } from "react"
import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  GearSix,
  WarningCircle,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { RecordsPanel } from "@/components/admin/admin-shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
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
        setScheduleEnabled(result.settings.enabled)
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
        enabled: scheduleEnabled,
        hour,
        minute,
      })
      setData((current) =>
        current ? { ...current, settings: result.settings } : current
      )
      toast.success(scheduleEnabled ? "每日同步时间已保存" : "定时同步已关闭")
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
      setScheduleEnabled(settings.enabled)
      setScheduleTime(formatTime(settings.hour, settings.minute))
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">企业微信客户同步</h2>
              <SyncStatusBadge settings={settings} />
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {getSyncSummary(settings)}
            </p>
            {settings?.lastError ? (
              <p className="mt-2 max-w-3xl text-xs leading-5 text-destructive">
                {settings.lastError}
              </p>
            ) : null}
          </div>

          <div className="flex gap-3 sm:items-center">
            <Button
              className="h-9 rounded-md"
              disabled={!settings}
              onClick={() => handleScheduleOpenChange(true)}
              type="button"
              variant="outline"
            >
              <GearSix size={16} weight="bold" />
              同步设置
            </Button>
            <Button
              className="h-9 rounded-md"
              disabled={isSyncing || !settings?.configured}
              onClick={handleSync}
              type="button"
              variant="brand"
            >
              <ArrowsClockwise
                className={cn(isSyncing && "animate-spin")}
                size={16}
                weight="bold"
              />
              {isSyncing ? "同步中" : "立即同步"}
            </Button>
          </div>
        </div>
      </Card>

      <Dialog onOpenChange={handleScheduleOpenChange} open={isScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>同步设置</DialogTitle>
            <DialogDescription>
              设置企业微信客户数据的每日自动同步时间，统一按北京时间执行。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/35 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">每日自动同步</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  容器重启后会自动恢复同步计划
                </span>
              </span>
              <input
                checked={scheduleEnabled}
                className="size-4 shrink-0 accent-blue-700"
                disabled={!settings?.configured}
                onChange={(event) => setScheduleEnabled(event.target.checked)}
                type="checkbox"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Clock className="text-muted-foreground" size={16} />
                每日同步时间
              </span>
              <input
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                disabled={!scheduleEnabled || !settings?.configured}
                onChange={(event) => setScheduleTime(event.target.value)}
                type="time"
                value={scheduleTime}
              />
              <span className="text-xs font-normal text-muted-foreground">
                时区：Asia/Shanghai（北京时间）
              </span>
            </label>

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
        count={pagination?.totalCount ?? 0}
        description="数据来自企业微信客户联系接口，仅供查看，不可在此编辑。"
        query={queryInput}
        searchPlaceholder="搜索客户、地区、标签或添加人"
        setQuery={setQueryInput}
        title="客户列表"
      >
        <Table className="min-w-[1500px]">
          <TableHeader>
            <TableRow>
              <TableHead>客户名称@客户类型</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>职位</TableHead>
              <TableHead>客户企业</TableHead>
              <TableHead>学员区分</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>对接阿姨</TableHead>
              <TableHead>添加人</TableHead>
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
                  colSpan={12}
                >
                  正在加载客户数据...
                </TableCell>
              </TableRow>
            ) : data?.customers.length ? (
              data.customers.map((customer) => (
                <CustomerRow customer={customer} key={customer.relationId} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={12}
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

function CustomerRow({ customer }: { customer: WecomCustomer }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          {customer.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- WeCom supplies remote avatar URLs.
            <img
              alt=""
              className="size-9 rounded-full bg-muted object-cover"
              loading="lazy"
              src={customer.avatar}
            />
          ) : (
            <span className="size-9 rounded-full bg-muted" />
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
      {[
        customer.position,
        customer.corpName,
        customer.studentType,
        customer.region,
        customer.auntie,
        customer.followUser,
        customer.description,
        customer.remarkMobiles,
        customer.addTime,
        customer.addWay,
      ].map((value, index) => (
        <TableCell className="max-w-56 truncate" key={index} title={value}>
          {value || "-"}
        </TableCell>
      ))}
    </TableRow>
  )
}

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

function SyncStatusBadge({ settings }: { settings?: WecomSyncSettings }) {
  if (!settings?.configured) {
    return <Badge className="bg-destructive/10 text-destructive">未配置</Badge>
  }
  if (settings.lastStatus === "running") {
    return <Badge className="bg-blue-50 text-blue-700">同步中</Badge>
  }
  if (settings.lastStatus === "failed") {
    return (
      <Badge className="gap-1 bg-red-50 text-red-700">
        <WarningCircle size={12} />
        同步失败
      </Badge>
    )
  }
  if (settings.lastStatus === "success") {
    return (
      <Badge className="gap-1 bg-emerald-50 text-emerald-700">
        <CheckCircle size={12} weight="fill" />
        同步成功
      </Badge>
    )
  }
  return <Badge variant="secondary">尚未同步</Badge>
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
  return `上次完成：${lastSync} · 客户关系 ${settings.lastCount} 条 · 下次执行：${nextSync}`
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function getGenderLabel(gender: WecomCustomer["gender"]) {
  return gender === "male" ? "男" : gender === "female" ? "女" : "未知"
}
