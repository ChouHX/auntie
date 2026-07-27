"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={className}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-[background-color,border-color,box-shadow,color] outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>span]:truncate",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  alignItemWithTrigger,
  className,
  children,
  position: positionProp,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  alignItemWithTrigger?: boolean
}) {
  const position =
    positionProp ?? (alignItemWithTrigger === true ? "item-aligned" : "popper")
  const shouldAlignItemWithTrigger = alignItemWithTrigger ?? false

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={shouldAlignItemWithTrigger}
        data-position={position}
        className={cn(
          "relative z-[80] max-h-96 min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[position=popper]:max-h-[min(18rem,var(--radix-select-content-available-height))] data-[position=popper]:min-w-[var(--radix-select-trigger-width)]",
          position === "popper" &&
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        position={position}
        align={align}
        side={side}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectViewport position={position}>{children}</SelectViewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectViewport({
  children,
  position,
}: {
  children: React.ReactNode
  position: React.ComponentProps<typeof SelectPrimitive.Content>["position"]
}) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const [scrollState, setScrollState] = React.useState({
    canScroll: false,
    thumbHeight: 0,
    thumbTop: 0,
  })

  const updateScrollState = React.useCallback(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const { clientHeight, scrollHeight, scrollTop } = viewport
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 0)
    const canScroll = maxScrollTop > 1
    const thumbHeight = canScroll
      ? Math.max((clientHeight / scrollHeight) * clientHeight, 24)
      : clientHeight
    const thumbTravel = Math.max(clientHeight - thumbHeight, 0)
    const thumbTop = canScroll ? (scrollTop / maxScrollTop) * thumbTravel : 0

    setScrollState({ canScroll, thumbHeight, thumbTop })
  }, [])

  React.useLayoutEffect(() => {
    updateScrollState()

    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(viewport)

    for (const child of Array.from(viewport.children)) {
      observer.observe(child)
    }

    return () => observer.disconnect()
  }, [children, updateScrollState])

  return (
    <div className="relative">
      <SelectPrimitive.Viewport asChild>
        <div
          data-position={position}
          ref={viewportRef}
          className={cn(
            "max-h-72 [scrollbar-width:none] [overflow-x:hidden!important] [overflow-y:auto!important] overscroll-contain p-1 pr-4 [&::-webkit-scrollbar]:hidden",
            position === "popper" &&
              "max-h-[min(18rem,var(--radix-select-content-available-height))] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
          onScroll={updateScrollState}
          style={{
            maxHeight:
              "min(18rem, var(--radix-select-content-available-height))",
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </SelectPrimitive.Viewport>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1 right-1 bottom-1 w-1.5 rounded-full bg-border/35",
          !scrollState.canScroll && "hidden"
        )}
      >
        <div
          className="absolute right-0 left-0 rounded-full bg-muted-foreground/55"
          style={{
            height: scrollState.thumbHeight,
            transform: `translateY(${scrollState.thumbTop}px)`,
          }}
        />
      </div>
    </div>
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
        "focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
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

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center bg-popover py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center bg-popover py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
