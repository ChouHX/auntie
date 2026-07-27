"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const PopoverMotionContext = React.createContext({ open: false })

function Popover({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = controlledOpen ?? uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [controlledOpen, onOpenChange]
  )

  const contextValue = React.useMemo(() => ({ open }), [open])

  return (
    <PopoverMotionContext.Provider value={contextValue}>
      <PopoverPrimitive.Root
        onOpenChange={handleOpenChange}
        open={open}
        {...props}
      />
    </PopoverMotionContext.Provider>
  )
}

const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 8,
  children,
  style,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const { open } = React.useContext(PopoverMotionContext)
  const prefersReducedMotion = useReducedMotion()
  const offset = getPopoverMotionOffset(side)
  const initialState = prefersReducedMotion
    ? { opacity: 0 }
    : {
        opacity: 0,
        scale: 0.92,
        x: offset.x,
        y: offset.y,
      }
  const animateState = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, x: 0, y: 0 }
  const exitState = prefersReducedMotion
    ? { opacity: 0 }
    : {
        opacity: 0,
        scale: 0.96,
        x: offset.x * 0.75,
        y: offset.y * 0.75,
      }
  const transition = prefersReducedMotion
    ? ({ duration: 0.1, ease: "easeOut" } as const)
    : ({ damping: 24, mass: 0.72, stiffness: 360, type: "spring" } as const)

  return (
    <PopoverPrimitive.Portal forceMount>
      <AnimatePresence initial={false}>
        {open ? (
          <PopoverPrimitive.Content
            align={align}
            className={cn("z-50 outline-none", !open && "pointer-events-none")}
            forceMount
            key="popover-content"
            side={side}
            sideOffset={sideOffset}
            {...props}
          >
            <motion.div
              data-side={side}
              data-slot="popover-content"
              animate={animateState}
              className={cn(
                "w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg will-change-[opacity,transform] outline-none",
                className
              )}
              exit={exitState}
              initial={initialState}
              style={{
                ...style,
                transformOrigin:
                  style?.transformOrigin ??
                  "var(--radix-popover-content-transform-origin, center)",
              }}
              transition={transition}
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        ) : null}
      </AnimatePresence>
    </PopoverPrimitive.Portal>
  )
}

function getPopoverMotionOffset(
  side: React.ComponentProps<typeof PopoverPrimitive.Content>["side"]
) {
  switch (side) {
    case "top":
      return { x: 0, y: 10 }
    case "right":
      return { x: -10, y: 0 }
    case "left":
      return { x: 10, y: 0 }
    case "bottom":
    default:
      return { x: 0, y: -10 }
  }
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
