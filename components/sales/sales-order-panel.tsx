"use client"

import { OrderMonthSelect } from "@/components/sales/order-month-select"

import { type FormEvent, useEffect, useState } from "react"
import { ClipboardList, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { SalesDataPagination } from "@/components/sales/sales-data-pagination"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SalesOrder, SalesOrderPage } from "@/lib/sales-orders"
import { fetchAdminSalesOrders } from "@/lib/cms-api"

const statusLabels: Record<SalesOrder["status"], string> = {
  awaiting_confirmation: "待确认",
  cancelled: "已取消",
  failed: "支付失败",
  paid: "已支付",
  pending: "待支付",
  unpaid: "未支付",
}

export function SalesOrderPanel({
  adminView,
  reloadKey,
}: {
  adminView?: {
    memberId: string
    memberName: string
    month: string
    months: string[]
    onMonthChange: (month: string) => void
    token: string
  }
  reloadKey: number
}) {
  const [data, setData] = useState<SalesOrderPage | null>(null)
  const [input, setInput] = useState("")
  const [localMonth, setMonth] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const month = adminView?.month ?? localMonth
  const adminToken = adminView?.token
  const salesMemberId = adminView?.memberId

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      query,
      month,
    })
    const request =
      adminToken && salesMemberId
        ? fetchAdminSalesOrders(adminToken, salesMemberId, {
            month,
            page,
            pageSize,
            query,
          })
        : fetch(`/api/sales/orders?${params}`, { cache: "no-store" }).then(
            async (response) => {
              const result = await response.json().catch(() => ({}))
              if (!response.ok)
                throw new Error(result.message || "订单数据加载失败")
              return result as SalesOrderPage
            }
          )
    request
      .then((result) => {
        if (mounted) {
          setError("")
          setData(result)
          setPage(result.pagination.page)
        }
      })
      .catch((error) => {
        if (mounted) {
          const message =
            error instanceof Error ? error.message : "订单数据加载失败"
          setData(null)
          setError(message)
          toast.error(message)
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [page, pageSize, query, reloadKey, month, adminToken, salesMemberId])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (page === 1 && query === input.trim()) return
    setLoading(true)
    setPage(1)
    setQuery(input.trim())
  }

  const pagination = data?.pagination ?? {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  }

  return (
    <Card className="overflow-hidden rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">
              {adminView ? `${adminView.memberName}的订单` : "我的订单"}
            </h2>
            <Badge variant="secondary">{pagination.totalCount}</Badge>
          </div>
        </div>
        <form
          className="flex w-full items-center gap-2 sm:w-auto"
          onSubmit={search}
        >
          <OrderMonthSelect
            months={adminView?.months ?? data?.months ?? []}
            value={month}
            onValueChange={(nextMonth) => {
              if (adminView) adminView.onMonthChange(nextMonth)
              else setMonth(nextMonth)
              setPage(1)
              setLoading(true)
            }}
          />
          <Input
            aria-label={adminView ? "搜索销售订单" : "搜索我的订单"}
            className="h-8 min-w-0 flex-1 text-xs sm:w-56"
            onChange={(event) => setInput(event.target.value)}
            placeholder="搜索订单号、客户或地区"
            value={input}
          />
          <Button
            aria-label="搜索"
            className="size-8 shrink-0"
            size="icon"
            type="submit"
          >
            <Search className="size-4" />
          </Button>
        </form>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-muted/30 px-3 py-2 text-xs"
        aria-live="polite"
      >
        <p className="text-muted-foreground">
          服务月份：{month || "全部"}· 全部筛选结果合计
        </p>
        {loading
          ? "加载中..."
          : error
            ? "汇总加载失败"
            : data?.totals.length
              ? data.totals.map((total) => (
                  <p key={total.currency}>
                    订单总金额：{formatMoney(total.amount, total.currency)} ·
                    提成总额：{formatMoney(total.commission, total.currency)}
                  </p>
                ))
              : "订单总金额：0.00 · 提成总额：0.00"}
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[900px] text-xs [&_td]:px-3 [&_td]:py-2 [&_th]:h-9 [&_th]:px-3">
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>订单状态</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>清洁类型</TableHead>
              <TableHead>服务日期</TableHead>
              <TableHead className="text-right">订单金额</TableHead>
              <TableHead className="text-right">销售分成</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={8}
                >
                  正在加载订单数据...
                </TableCell>
              </TableRow>
            ) : data?.orders.length ? (
              data.orders.map((order) => (
                <SalesOrderRow key={order.orderId} order={order} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={8}
                >
                  {error ||
                    (query
                      ? "没有找到匹配的订单"
                      : adminView
                        ? "该销售在所选月份暂无订单"
                        : "暂无归属到你的订单")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SalesDataPagination
        disabled={loading}
        itemLabel="笔订单"
        onPageChange={(nextPage) => {
          setLoading(true)
          setPage(nextPage)
        }}
        onPageSizeChange={(nextPageSize) => {
          setLoading(true)
          setPage(1)
          setPageSize(nextPageSize)
        }}
        {...pagination}
      />
    </Card>
  )
}

function SalesOrderRow({ order }: { order: SalesOrder }) {
  return (
    <TableRow className="[&>td]:h-10">
      <TableCell className="font-mono font-medium">{order.orderId}</TableCell>
      <TableCell className="max-w-48 truncate" title={order.customerName}>
        {order.customerName || "-"}
      </TableCell>
      <TableCell>
        <Badge
          className={
            order.status === "paid"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : undefined
          }
          variant="secondary"
        >
          {statusLabels[order.status]}
        </Badge>
      </TableCell>
      <TableCell>{order.region || "-"}</TableCell>
      <TableCell>{order.cleaningType || "-"}</TableCell>
      <TableCell>{order.serviceDate || "-"}</TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {formatMoney(order.amount, order.currency)}
      </TableCell>
      <TableCell className="text-right font-semibold text-primary tabular-nums">
        {formatMoney(order.salesCommission, order.currency)}
      </TableCell>
    </TableRow>
  )
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`
}
