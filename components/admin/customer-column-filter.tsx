"use client"

import { useEffect, useState } from "react"
import { Funnel, MagnifyingGlass, X } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { searchAdminRepeatCustomerOptions } from "@/lib/cms-api"
import {
  cacheWecomCustomers,
  readCachedWecomCustomers,
} from "@/lib/wecom-customer-cache"
import { cn } from "@/lib/utils"

type CustomerOption = {
  avatar?: string
  label: string
  relationId: string
}

/**
 * 表头 Excel 式筛选：搜索框 + 懒加载候选客户列表（滚动到底自动加载更多）。
 * 选中的客户通过 relationId 回传，父组件只需本地过滤已加载的行。
 */
function CustomerColumnFilter({
  appliedCount,
  onChange,
  selected,
  token,
}: {
  appliedCount: number
  onChange: (relationIds: string[]) => void
  selected: string[]
  token: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<CustomerOption[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return

    const cached = readCachedWecomCustomers(token, query)
    let isMounted = true

    // 命中缓存时也放到异步任务里，避免在 effect 中同步 setState。
    const timer = window.setTimeout(async () => {
      if (cached) {
        setOptions(
          cached.customers.map((customer) => ({
            avatar: customer.avatar,
            label: customer.nameAndType,
            relationId: customer.relationId,
          }))
        )
        setPage(cached.pagination.page)
        setTotalPages(cached.pagination.totalPages)
        setError("")
        return
      }

      setIsLoading(true)
      setError("")
      try {
        const result = await searchAdminRepeatCustomerOptions(token, {
          page: 1,
          pageSize: 20,
          query,
        })
        if (!isMounted) return
        setOptions(
          result.customers.map((customer) => ({
            avatar: customer.avatar,
            label: customer.nameAndType,
            relationId: customer.relationId,
          }))
        )
        setPage(result.pagination.page)
        setTotalPages(result.pagination.totalPages)
        cacheWecomCustomers(
          token,
          query,
          result.customers,
          result.pagination
        )
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "客户加载失败"
          )
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }, cached ? 0 : 250)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [open, query, token])

  async function loadMore() {
    if (isLoading || isLoadingMore || page >= totalPages) return

    setIsLoadingMore(true)
    try {
      const result = await searchAdminRepeatCustomerOptions(token, {
        page: page + 1,
        pageSize: 20,
        query,
      })
      setOptions((current) => {
        const seen = new Set(current.map((item) => item.relationId))
        return [
          ...current,
          ...result.customers
            .filter((customer) => !seen.has(customer.relationId))
            .map((customer) => ({
              avatar: customer.avatar,
              label: customer.nameAndType,
              relationId: customer.relationId,
            })),
        ]
      })
      setPage(result.pagination.page)
      setTotalPages(result.pagination.totalPages)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败")
    } finally {
      setIsLoadingMore(false)
    }
  }

  function toggle(relationId: string, checked: boolean) {
    onChange(
      checked
        ? Array.from(new Set([...selected, relationId]))
        : selected.filter((item) => item !== relationId)
    )
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label="筛选客户"
          className={cn(
            "ml-1 size-6 rounded",
            appliedCount ? "text-primary" : "text-muted-foreground"
          )}
          size="icon-xs"
          variant="ghost"
        >
          <Funnel size={12} weight={appliedCount ? "fill" : "regular"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
          <MagnifyingGlass
            className="shrink-0 text-muted-foreground"
            size={14}
          />
          <Input
            autoFocus
            className="h-7 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索客户姓名、企业或地区"
            value={query}
          />
        </div>

        <div
          className="max-h-56 overflow-y-auto overscroll-contain p-1"
          onScroll={(event) => {
            const element = event.currentTarget
            if (
              element.scrollTop + element.clientHeight >=
              element.scrollHeight - 24
            ) {
              void loadMore()
            }
          }}
        >
          {selected.length ? (
            <div className="mb-1 flex items-center justify-between rounded px-2 py-1 text-[11px] text-muted-foreground">
              <span>已选 {selected.length} 位客户</span>
              <button
                className="flex items-center gap-0.5 hover:text-foreground"
                onClick={() => onChange([])}
                type="button"
              >
                <X size={11} />
                清除
              </button>
            </div>
          ) : null}
          {isLoading && !options.length ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              正在加载客户...
            </div>
          ) : error ? (
            <div className="py-6 text-center text-xs text-destructive">
              {error}
            </div>
          ) : options.length ? (
            options.map((option) => (
              <label
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                key={option.relationId}
              >
                <Checkbox
                  checked={selected.includes(option.relationId)}
                  onCheckedChange={(checked) =>
                    toggle(option.relationId, checked === true)
                  }
                />
                {option.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 企业微信提供远程头像地址。
                  <img
                    alt=""
                    className="size-5 shrink-0 rounded-full bg-muted object-cover"
                    loading="lazy"
                    src={option.avatar}
                  />
                ) : (
                  <span className="size-5 shrink-0 rounded-full bg-muted" />
                )}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </label>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              没有匹配的客户
            </div>
          )}
          {isLoadingMore ? (
            <div className="py-2 text-center text-[11px] text-muted-foreground">
              加载更多...
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">
            {selected.length ? `已选 ${selected.length} 位` : "未选择"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              className="h-7"
              onClick={() => onChange([])}
              size="sm"
              variant="ghost"
            >
              重置
            </Button>
            <Button
              className="h-7"
              onClick={() => setOpen(false)}
              size="sm"
            >
              完成
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { CustomerColumnFilter }
