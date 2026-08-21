"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  getModalMotion,
  getModalOverlayTransition,
} from "@/components/ui/modal-motion"

const AlertDialogMotionContext = React.createContext({ open: false })

function AlertDialog({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
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
    <AlertDialogMotionContext.Provider value={contextValue}>
      <AlertDialogPrimitive.Root
        onOpenChange={handleOpenChange}
        open={open}
        {...props}
      />
    </AlertDialogMotionContext.Provider>
  )
}

const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  const prefersReducedMotion = useReducedMotion()
  const transition = getModalOverlayTransition(prefersReducedMotion)

  return (
    <AlertDialogPrimitive.Overlay asChild forceMount {...props}>
      <motion.div
        data-slot="alert-dialog-overlay"
        animate={{ opacity: 1 }}
        className={cn("fixed inset-0 z-[60] bg-black/45", className)}
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={transition}
      />
    </AlertDialogPrimitive.Overlay>
  )
}

function AlertDialogContent({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const { open } = React.useContext(AlertDialogMotionContext)
  const prefersReducedMotion = useReducedMotion()
  const { initial, animate, exit, transition } =
    getModalMotion(prefersReducedMotion)

  return (
    <AlertDialogPortal forceMount>
      <AnimatePresence initial={false}>
        {open ? <AlertDialogOverlay key="alert-dialog-overlay" /> : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {open ? (
          <AlertDialogPrimitive.Content
            asChild
            forceMount
            key="alert-dialog-content"
            {...props}
          >
            <motion.div
              data-slot="alert-dialog-content"
              animate={animate}
              className={cn(
                "fixed top-1/2 left-1/2 z-[61] grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md gap-4 overflow-y-auto rounded-xl border bg-background p-5 shadow-2xl sm:p-6",
                className
              )}
              exit={exit}
              initial={initial}
              style={style}
              transition={transition}
            >
              {children}
            </motion.div>
          </AlertDialogPrimitive.Content>
        ) : null}
      </AnimatePresence>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
