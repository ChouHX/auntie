"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const Tooltip = TooltipPrimitive.Root
const TooltipProvider = TooltipPrimitive.Provider
const TooltipTrigger = TooltipPrimitive.Trigger

function TooltipContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          "data-[state=delayed-open]:animate-popup-in data-[state=closed]:animate-popup-out z-60 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md",
          className
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
