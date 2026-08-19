"use client"

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

const statusLabels: Record<SalesOrder["status"], string> = {
  awaiting_confirmation: "待确认",
  cancelled: "已取消",
  failed: "支付失败",
  paid: "已支付",
  pending: "待支付",
  unpaid: "未支付",
}

export function SalesOrderPanel({ reloadKey }: { reloadKey: number }) {
  const [data, setData] = useState<SalesOrderPage | null>(null)
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      query,
    })
    fetch(`/api/sales/orders?${params}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.message || "订单数据加载失败")
        if (mounted) {
          setData(result)
          setPage(result.pagination.page)
        }
      })
      .catch((error) => {
        if (mounted)
          toast.error(
            error instanceof Error ? error.message : "订单数据加载失败"
          )
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [page, pageSize, query, reloadKey])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">我的订单</h2>
            <Badge variant="secondary">{pagination.totalCount}</Badge>
          </div>
        </div>
        <form className="flex w-full gap-2 sm:w-80" onSubmit={search}>
          <Input
            aria-label="搜索我的订单"
            className="h-9 min-w-0"
            onChange={(event) => setInput(event.target.value)}
            placeholder="搜索订单号、客户或地区"
            value={input}
          />
          <Button
            aria-label="搜索"
            className="size-9"
            size="icon"
            type="submit"
          >
            <Search className="size-4" />
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[920px] text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>订单状态</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>清洁类型</TableHead>
              <TableHead>服务日期</TableHead>
              <TableHead className="text-right">订单金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={7}
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
                  colSpan={7}
                >
                  {query ? "没有找到匹配的订单" : "暂无归属到你的订单"}
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
    <TableRow className="[&>td]:h-12">
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
        {order.currency}{" "}
        {order.amount.toLocaleString("zh-CN", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
      </TableCell>
    </TableRow>
  )
}
