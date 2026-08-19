"use client"

import { type FormEvent, useEffect, useState } from "react"
import { Search, Users } from "lucide-react"
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
import type { SalesCustomer, SalesCustomerPage } from "@/lib/sales-customers"

const emptyPagination = {
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
}

export function SalesCustomerPanel({ reloadKey }: { reloadKey: number }) {
  const [data, setData] = useState<SalesCustomerPage | null>(null)
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
    fetch(`/api/sales/customers?${params}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.message || "客户数据加载失败")
        if (mounted) {
          setData(result)
          setPage(result.pagination.page)
        }
      })
      .catch((error) => {
        if (mounted) {
          toast.error(
            error instanceof Error ? error.message : "客户数据加载失败"
          )
        }
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

  const pagination = data?.pagination ?? emptyPagination

  return (
    <Card className="overflow-hidden rounded-lg shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">我的客户</h2>
            <Badge variant="secondary">{pagination.totalCount}</Badge>
          </div>
        </div>
        <form className="flex w-full gap-2 sm:w-80" onSubmit={search}>
          <Input
            aria-label="搜索我的客户"
            className="h-9 min-w-0"
            onChange={(event) => setInput(event.target.value)}
            placeholder="搜索客户、地区或备注"
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
        <Table className="min-w-[1080px] text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>客户</TableHead>
              <TableHead>学员区分</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>对接阿姨</TableHead>
              <TableHead>联系方式</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>添加时间</TableHead>
              <TableHead>来源</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={8}
                >
                  正在加载客户数据...
                </TableCell>
              </TableRow>
            ) : data?.customers.length ? (
              data.customers.map((customer) => (
                <SalesCustomerRow
                  customer={customer}
                  key={customer.relationId}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={8}
                >
                  {query ? "没有找到匹配的客户" : "暂无归属到你的客户"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SalesDataPagination
        disabled={loading}
        itemLabel="位客户"
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

function SalesCustomerRow({ customer }: { customer: SalesCustomer }) {
  const company = [customer.corpName, customer.position]
    .filter(Boolean)
    .join(" · ")
  return (
    <TableRow className="[&>td]:h-12">
      <TableCell>
        <div className="flex items-center gap-2">
          {customer.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- WeCom supplies remote avatar URLs.
            <img
              alt=""
              className="size-8 rounded-full bg-muted object-cover"
              loading="lazy"
              src={customer.avatar}
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
              {(customer.nameAndType || "客").slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <p className="max-w-52 truncate font-medium text-foreground">
              {customer.nameAndType || "-"}
            </p>
            <p
              className="mt-0.5 max-w-52 truncate text-muted-foreground"
              title={company}
            >
              {company || "-"}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <TagList value={customer.studentType} />
      </TableCell>
      <CompactCell value={customer.region} />
      <CompactCell value={customer.auntie} />
      <CompactCell value={customer.remarkMobiles} />
      <CompactCell value={customer.description} />
      <CompactCell value={formatCustomerTime(customer.addTime)} />
      <CompactCell value={customer.addWay} />
    </TableRow>
  )
}

function CompactCell({ value }: { value: string }) {
  return (
    <TableCell className="max-w-48 truncate" title={value}>
      {value || "-"}
    </TableCell>
  )
}

function TagList({ value }: { value: string }) {
  const tags = value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tags.length ? (
    <div className="flex max-w-48 flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  ) : (
    <span className="text-muted-foreground">-</span>
  )
}

function formatCustomerTime(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date)
}
