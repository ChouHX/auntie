"use client"

import { type FormEvent, useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { HouseLine } from "@phosphor-icons/react"
import {
  CalendarDays,
  CircleDollarSign,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AdminLayout, type AdminNavItem } from "@/components/admin/admin-layout"
import { useTheme } from "@/components/theme-provider"
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type {
  MoneyTotal,
  SalesOrderRanking,
  SalesUserDashboard,
} from "@/lib/sales-user-dashboard"

type SalesSection = "dashboard"

const salesSections: AdminNavItem<SalesSection>[] = [
  { id: "dashboard", label: "Dashboard", icon: HouseLine, group: "main" },
]

export function SalesPortal() {
  const [data, setData] = useState<SalesUserDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const { setTheme, theme } = useTheme()

  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const response = await fetch("/api/sales/dashboard", {
        cache: "no-store",
      })
      setData(response.ok ? await response.json() : null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    fetch("/api/sales/dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (mounted) setData(response.ok ? await response.json() : null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <SalesLoading />
  if (!data)
    return (
      <SalesLogin
        onSuccess={() => {
          setLoading(true)
          void loadDashboard()
        }}
      />
    )

  async function logout() {
    await fetch("/api/sales/logout", { method: "POST" })
    setData(null)
  }

  return (
    <>
      <AdminLayout
        accountName={data.member.name}
        accountSubtitle={`销售账号 · ${data.member.username}`}
        activeSection="dashboard"
        isDarkTheme={theme === "dark"}
        isRefreshing={refreshing}
        isSaving={false}
        items={salesSections}
        logoImage="/logo.webp"
        onLogout={() => void logout()}
        onPasswordChange={() => setPasswordDialogOpen(true)}
        onRefresh={() => void loadDashboard(true)}
        onSectionChange={() => undefined}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        showSidebar={false}
        subtitle={`${data.member.name} · 截至今日的客户与成交数据`}
        title="Dashboard"
      >
        <div className="space-y-5">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">你好，{data.member.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              截至今日的客户与成交数据
            </p>
          </div>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={Users}
              label="总添加客户数"
              value={String(data.customerCounts.total)}
            />
            <MetricCard
              icon={UserPlus}
              label="今日添加客户数"
              value={String(data.customerCounts.today)}
            />
            <MetricCard
              icon={CalendarDays}
              label="本周添加客户数"
              value={String(data.customerCounts.week)}
            />
            <MetricCard
              icon={CalendarDays}
              label="本月添加客户数"
              value={String(data.customerCounts.month)}
            />
            <MetricCard
              className="col-span-2 lg:col-span-2"
              icon={CircleDollarSign}
              label={`${data.monthLabel}利润`}
              value={formatMoneyTotals(data.monthlyProfit)}
            />
            <MetricCard
              className="col-span-2 lg:col-span-2"
              icon={CircleDollarSign}
              label="订单总利润"
              value={formatMoneyTotals(data.orderProfitTotal)}
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <RankingPanel
              currentMemberId={data.member.id}
              mode="count"
              rankings={data.orderCountRanking}
              title="本月成交订单量排行"
            />
            <RankingPanel
              currentMemberId={data.member.id}
              mode="revenue"
              rankings={data.orderRevenueRanking}
              title="本月成交金额排行"
            />
          </section>
        </div>
      </AdminLayout>
      <SalesPasswordDialog
        onOpenChange={setPasswordDialogOpen}
        open={passwordDialogOpen}
      />
    </>
  )
}

function SalesPasswordDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error("新密码至少需要 8 位。")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致。")
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch("/api/sales/password", {
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || "密码修改失败")
      reset()
      onOpenChange(false)
      toast.success("密码已修改。下次登录请使用新密码。")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "密码修改失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen && submitting) return
        if (!nextOpen && !submitting) reset()
        onOpenChange(nextOpen)
      }}
      open={open}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>
            修改后其他设备上的旧登录会话将自动失效。
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="text-sm font-medium" htmlFor="current-password">
              当前密码
            </label>
            <Input
              autoComplete="current-password"
              className="mt-2 h-10"
              disabled={submitting}
              id="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="new-password">
              新密码
            </label>
            <Input
              autoComplete="new-password"
              className="mt-2 h-10"
              disabled={submitting}
              id="new-password"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">至少 8 位</p>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="confirm-password">
              确认新密码
            </label>
            <Input
              autoComplete="new-password"
              className="mt-2 h-10"
              disabled={submitting}
              id="confirm-password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              disabled={
                submitting ||
                !currentPassword ||
                newPassword.length < 8 ||
                !confirmPassword
              }
              type="submit"
            >
              {submitting ? "保存中..." : "保存密码"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SalesLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch("/api/sales/login", {
        body: JSON.stringify({ password, username }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || "登录失败")
      onSuccess()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="relative hidden min-h-screen md:block">
        <Image
          alt="陈阿姨到家服务团队"
          className="absolute inset-0 size-full object-cover"
          fill
          priority
          sizes="50vw"
          src="/about_us.png"
        />
        <div className="absolute inset-0 bg-slate-950/20" />
      </div>
      <div className="flex items-center justify-center px-5 py-10">
        <form className="w-full max-w-sm" onSubmit={submit}>
          <Image
            alt="陈阿姨到家"
            className="size-12 rounded-md"
            height={48}
            priority
            src="/logo.webp"
            width={48}
          />
          <h1 className="mt-6 text-3xl font-semibold">销售工作台</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            登录查看你的销售数据
          </p>
          <label
            className="mt-8 block text-sm font-medium"
            htmlFor="sales-username"
          >
            登录账号
          </label>
          <Input
            autoComplete="username"
            className="mt-2 h-11"
            id="sales-username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
          <label
            className="mt-5 block text-sm font-medium"
            htmlFor="sales-password"
          >
            密码
          </label>
          <Input
            autoComplete="current-password"
            className="mt-2 h-11"
            id="sales-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            className="mt-6 h-11 w-full"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "登录中..." : "登录"}
          </Button>
        </form>
      </div>
    </main>
  )
}

function MetricCard({
  className,
  icon: Icon,
  label,
  value,
}: {
  className?: string
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <Card className={cn("min-w-0 rounded-lg p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
        <Icon className="size-4 text-primary" />
        <span>{label}</span>
      </div>
      <p className="mt-3 text-xl font-semibold break-words tabular-nums sm:text-2xl">
        {value}
      </p>
    </Card>
  )
}

function RankingPanel({
  currentMemberId,
  mode,
  rankings,
  title,
}: {
  currentMemberId: string
  mode: "count" | "revenue"
  rankings: SalesOrderRanking[]
  title: string
}) {
  return (
    <Card className="overflow-hidden rounded-lg shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4 sm:px-5">
        <Trophy className="size-4 text-amber-600" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {rankings.slice(0, 10).map((item, index) => {
          const isCurrent = item.salesMemberId === currentMemberId
          return (
            <div
              className={cn(
                "grid min-h-14 grid-cols-[2rem_1fr_auto] items-center gap-2 px-4 py-3 sm:px-5",
                isCurrent && "bg-primary/5"
              )}
              key={item.salesMemberId}
            >
              <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {item.salesName}
                  </span>
                  {isCurrent ? <Badge variant="secondary">你</Badge> : null}
                </div>
                {mode === "revenue" ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.orderCount} 笔成交
                  </p>
                ) : null}
              </div>
              <span className="max-w-44 text-right text-sm font-semibold break-words tabular-nums">
                {mode === "count"
                  ? `${item.orderCount} 单`
                  : formatMoneyTotals(item.amounts)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function SalesLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/70">
      <span
        aria-label="正在加载"
        className="size-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
      />
    </main>
  )
}

function formatMoneyTotals(totals: MoneyTotal[]) {
  if (!totals.length) return "0.00"
  return totals
    .map(
      ({ amount, currency }) =>
        `${currency} ${amount.toLocaleString("zh-CN", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}`
    )
    .join(" · ")
}
