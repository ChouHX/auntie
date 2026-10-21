"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** 页码跳转输入框：分页过多时可直接跳到指定页。 */
function PageJump({
  className,
  disabled,
  onPageChange,
  page,
  totalPages,
}: {
  className?: string
  disabled?: boolean
  onPageChange: (page: number) => void
  page: number
  totalPages: number
}) {
  const [value, setValue] = useState(String(page))
  const [syncedPage, setSyncedPage] = useState(page)

  // 外部页码变化（筛选、翻页等）时同步输入框。
  if (page !== syncedPage) {
    setSyncedPage(page)
    setValue(String(page))
  }

  function commit() {
    const target = Math.trunc(Number(value))
    const clamped = Number.isFinite(target)
      ? Math.min(Math.max(target, 1), totalPages)
      : page

    setValue(String(clamped))
    if (clamped !== page) onPageChange(clamped)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
    >
      <span>跳至</span>
      <Input
        aria-label="跳转页码"
        className="h-8 w-14 rounded-md px-2 text-center text-xs tabular-nums"
        disabled={disabled || totalPages <= 1}
        inputMode="numeric"
        onBlur={commit}
        onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, ""))}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commit()
          }
        }}
        value={value}
      />
      <span>/ {totalPages} 页</span>
    </div>
  )
}

export { PageJump }
