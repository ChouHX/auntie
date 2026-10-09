"use client"

import { useId, useState } from "react"
import { X } from "lucide-react"

import {
  isEmailAddress,
  splitEmailAddresses,
  uniqueEmailAddresses,
} from "@/lib/email-addresses"
import { cn } from "@/lib/utils"

export function EmailTagInput({
  disabled = false,
  id,
  onChange,
  value,
}: {
  disabled?: boolean
  id: string
  onChange: (value: string[]) => void
  value: string[]
}) {
  const [input, setInput] = useState("")
  const hintId = useId()
  const invalid = value.some((email) => !isEmailAddress(email))

  function addEmails(text = input) {
    const next = splitEmailAddresses(text)
    if (next.length) onChange(uniqueEmailAddresses([...value, ...next]))
    setInput("")
  }

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          disabled && "opacity-50",
          invalid && "border-destructive"
        )}
      >
        {value.map((email) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs",
              !isEmailAddress(email) && "bg-destructive/10 text-destructive"
            )}
            key={email}
          >
            <span className="min-w-0 break-all">{email}</span>
            <button
              aria-label={`移除 ${email}`}
              className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-ring"
              disabled={disabled}
              onClick={() => onChange(value.filter((item) => item !== email))}
              type="button"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-describedby={hintId}
          aria-invalid={invalid || undefined}
          autoCapitalize="none"
          autoComplete="off"
          className="h-7 min-w-0 flex-1 basis-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          disabled={disabled}
          id={id}
          inputMode="email"
          onBlur={() => addEmails()}
          onChange={(event) => {
            const next = event.target.value
            if (/[,;，；\s]$/.test(next)) addEmails(next)
            else setInput(next)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === "Enter") {
              event.preventDefault()
              addEmails()
            }
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text")
            if (!/[,;，；\s]/.test(pasted)) return
            event.preventDefault()
            const start = event.currentTarget.selectionStart ?? input.length
            const end = event.currentTarget.selectionEnd ?? start
            addEmails(`${input.slice(0, start)}${pasted}${input.slice(end)}`)
          }}
          placeholder={value.length ? "继续添加邮箱" : "输入抄送邮箱"}
          spellCheck={false}
          value={input}
        />
      </div>
      <p
        className={cn(
          "text-xs leading-5 text-muted-foreground",
          invalid && "text-destructive"
        )}
        id={hintId}
      >
        {invalid
          ? "请移除并重新输入标红的无效邮箱。"
          : "回车或逗号添加，支持批量粘贴；留空则不抄送。"}
      </p>
    </div>
  )
}
