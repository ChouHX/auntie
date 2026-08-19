"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const pageSizeOptions = [10, 20, 50]

export function SalesDataPagination({
  disabled = false,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  totalCount,
  totalPages,
}: {
  disabled?: boolean
  itemLabel: string
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
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-2">
        <span>每页显示</span>
        <Select
          disabled={disabled}
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
        <span>{itemLabel}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="mr-auto sm:mr-0">
          显示 {start}-{end}，共 {totalCount} 条
        </span>
        <Button
          aria-label="上一页"
          className="size-8"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon-sm"
          title="上一页"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-14 text-center tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          aria-label="下一页"
          className="size-8"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="icon-sm"
          title="下一页"
          type="button"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
