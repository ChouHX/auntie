"use client"

import { useState, type ComponentProps } from "react"

import { Input } from "@/components/ui/input"

type NumberInputProps = Omit<
  ComponentProps<typeof Input>,
  "defaultValue" | "onChange" | "value"
> & {
  allowEmpty?: boolean
  onEmpty?: () => void
  onValueChange: (value: number) => void
  value?: number
}

function NumberInput({
  allowEmpty = false,
  min,
  onBlur,
  onEmpty,
  onValueChange,
  value,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = useState(() => formatValue(value))

  return (
    <Input
      {...props}
      inputMode="decimal"
      min={min}
      onBlur={(event) => {
        if (allowEmpty && event.currentTarget.value.trim() === "") {
          setDraft("")
          onEmpty?.()
          onBlur?.(event)
          return
        }
        const normalized = normalizeDraft(event.currentTarget.value, min)
        setDraft(formatValue(normalized))
        onValueChange(normalized)
        onBlur?.(event)
      }}
      onChange={(event) => {
        const nextDraft = event.target.value
        setDraft(nextDraft)
        if (nextDraft.trim() === "") {
          if (allowEmpty) onEmpty?.()
          return
        }
        const number = Number(nextDraft)
        if (Number.isFinite(number)) onValueChange(number)
      }}
      type="number"
      value={draft}
    />
  )
}

function normalizeDraft(value: string, min: NumberInputProps["min"]) {
  const number = Number(value)
  if (value.trim() !== "" && Number.isFinite(number)) return number

  const minimum = Number(min)
  return Number.isFinite(minimum) ? Math.max(0, minimum) : 0
}

function formatValue(value: number | undefined) {
  return Number.isFinite(value) ? String(value) : ""
}

export { NumberInput }
