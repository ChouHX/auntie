"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function OrderMonthSelect({
  months,
  value,
  onValueChange,
  allowAll = true,
}: {
  months: string[]
  value: string
  onValueChange: (value: string) => void
  allowAll?: boolean
}) {
  const years = Array.from(new Set(months.map((month) => month.slice(0, 4))))

  return (
    <Select
      value={value || "all"}
      onValueChange={(next) => {
        const month = next === "all" ? "" : next
        if (month !== value) onValueChange(month)
      }}
    >
      <SelectTrigger
        aria-label="订单生成月份（北京时间）"
        className="h-8 w-36 shrink-0"
      >
        <SelectValue placeholder="选择月份" />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value="all">全部月份</SelectItem>}
        {years.map((year) => (
          <SelectGroup key={year}>
            <SelectLabel>{year} 年</SelectLabel>
            {months
              .filter((month) => month.startsWith(`${year}-`))
              .map((month) => (
                <SelectItem key={month} value={month}>
                  {Number(month.slice(5))} 月
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
