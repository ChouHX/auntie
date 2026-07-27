import * as React from "react"
import { CaretDown, Check } from "@phosphor-icons/react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const selectScrollUnlockAttribute = "data-select-scroll-unlocked"
const selectDismissGuardAttribute = "data-select-dismiss-guard"
let selectDismissGuardTimeout: number | undefined

function getSelectScrollUnlockCount() {
  const count = Number(
    document.body.getAttribute(selectScrollUnlockAttribute) ?? 0
  )

  return Number.isFinite(count) ? count : 0
}

function incrementSelectScrollUnlock() {
  document.body.setAttribute(
    selectScrollUnlockAttribute,
    String(getSelectScrollUnlockCount() + 1)
  )
}

function decrementSelectScrollUnlock() {
  const count = getSelectScrollUnlockCount() - 1

  if (count <= 0) {
    document.body.removeAttribute(selectScrollUnlockAttribute)
    return
  }

  document.body.setAttribute(selectScrollUnlockAttribute, String(count))
}

function markSelectDismissGuard() {
  window.clearTimeout(selectDismissGuardTimeout)
  document.body.setAttribute(selectDismissGuardAttribute, "true")
  selectDismissGuardTimeout = window.setTimeout(() => {
    document.body.removeAttribute(selectDismissGuardAttribute)
  }, 180)
}

function Select({
  onOpenChange,
  open,
  defaultOpen,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = React.useState(Boolean(defaultOpen))
  const isOpen = open ?? internalOpen

  React.useEffect(() => {
    if (!isOpen) {
      return
    }

    incrementSelectScrollUnlock()
    return decrementSelectScrollUnlock
  }, [isOpen])

  return (
    <SelectPrimitive.Root
      defaultOpen={defaultOpen}
      onOpenChange={(nextOpen) => {
        setInternalOpen(nextOpen)
        if (!nextOpen) {
          markSelectDismissGuard()
        }
        onOpenChange?.(nextOpen)
      }}
      open={open}
      {...props}
    />
  )
}

const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-12 w-full items-center justify-between gap-2 rounded-md border border-input bg-background/78 px-3.5 py-2 text-sm text-foreground shadow-xs transition-[background-color,border-color,box-shadow,color] outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretDown className="size-4 opacity-55" weight="bold" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
          "data-[state=open]:animate-popup-in data-[state=closed]:animate-popup-out",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={14} weight="bold" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
