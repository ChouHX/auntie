"use client"

import { useState } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function SalesColumnFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[] | null
  onChange: (selected: string[] | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<string[]>([])
  const values = Array.from(new Set(options)).sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  )
  const visible = values.filter((value) =>
    (value || "（空白）")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase())
  )
  const checkedCount = visible.filter((value) => draft.includes(value)).length

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setQuery("")
          setDraft(selected ?? values)
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 whitespace-nowrap"
          aria-label={`筛选${label}`}
        >
          {label}
          <Filter
            className={`size-3.5 ${selected === null ? "text-muted-foreground" : "text-primary"}`}
          />
          {selected !== null && (
            <span className="text-primary">({selected.length})</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 space-y-2 rounded-md p-2 text-xs"
      >
        <Input
          className="h-8 px-2 py-1 text-xs md:text-xs"
          aria-label={`搜索${label}选项`}
          placeholder={`搜索${label}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="flex min-h-7 cursor-pointer items-center gap-2 px-1">
          <Checkbox
            className="size-3.5"
            disabled={!visible.length}
            checked={
              visible.length > 0 && checkedCount === visible.length
                ? true
                : checkedCount > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) =>
              setDraft((current) =>
                checked
                  ? Array.from(new Set([...current, ...visible]))
                  : current.filter((value) => !visible.includes(value))
              )
            }
          />
          {query ? "全选搜索结果" : "全选"}
        </label>
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {visible.map((value) => (
            <label
              key={value}
              className="flex min-h-7 cursor-pointer items-center gap-2 rounded px-1 py-1 break-all hover:bg-muted"
            >
              <Checkbox
                className="size-3.5"
                checked={draft.includes(value)}
                onCheckedChange={(checked) =>
                  setDraft((current) =>
                    checked
                      ? [...current, value]
                      : current.filter((item) => item !== value)
                  )
                }
              />
              {value || "（空白）"}
            </label>
          ))}
          {!visible.length && (
            <p className="text-muted-foreground">无匹配选项</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-1 border-t pt-2">
          <Button
            className="h-7 px-2 text-xs"
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
          >
            清除筛选
          </Button>
          <Button
            className="h-7 px-2 text-xs"
            size="sm"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            className="h-7 px-2 text-xs"
            size="sm"
            onClick={() => {
              onChange(
                values.every((value) => draft.includes(value)) ? null : draft
              )
              setOpen(false)
            }}
          >
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
