"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  getModalMotion,
  getModalOverlayTransition,
} from "@/components/ui/modal-motion"

const DialogMotionContext = React.createContext({ open: false })

function Dialog({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
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
    <DialogMotionContext.Provider value={contextValue}>
      <DialogPrimitive.Root
        onOpenChange={handleOpenChange}
        open={open}
        {...props}
      />
    </DialogMotionContext.Provider>
  )
}

const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const prefersReducedMotion = useReducedMotion()
  const transition = getModalOverlayTransition(prefersReducedMotion)

  return (
    <DialogPrimitive.Overlay asChild forceMount {...props}>
      <motion.div
        data-slot="dialog-overlay"
        animate={{ opacity: 1 }}
        className={cn("fixed inset-0 z-50 bg-black/45", className)}
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={transition}
      />
    </DialogPrimitive.Overlay>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  style,
  onInteractOutside,
  onPointerDownOutside,
  onFocusOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const { open } = React.useContext(DialogMotionContext)
  const prefersReducedMotion = useReducedMotion()
  const { initial, animate, exit, transition } =
    getModalMotion(prefersReducedMotion)

  return (
    <DialogPortal forceMount>
      <AnimatePresence initial={false}>
        {open ? <DialogOverlay key="dialog-overlay" /> : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {open ? (
          <DialogPrimitive.Content
            asChild
            forceMount
            key="dialog-content"
            onPointerDownOutside={(event) => {
              if (shouldPreventDialogDismiss(event)) {
                event.preventDefault()
                return
              }

              onPointerDownOutside?.(event)
            }}
            onFocusOutside={(event) => {
              if (shouldPreventDialogDismiss(event)) {
                event.preventDefault()
                return
              }

              onFocusOutside?.(event)
            }}
            onInteractOutside={(event) => {
              if (shouldPreventDialogDismiss(event)) {
                event.preventDefault()
                return
              }

              onInteractOutside?.(event)
            }}
            {...props}
          >
            <motion.div
              data-slot="dialog-content"
              animate={animate}
              className={cn(
                "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg gap-4 overflow-y-auto rounded-xl border bg-background p-5 shadow-2xl sm:p-6",
                className
              )}
              exit={exit}
              initial={initial}
              style={style}
              transition={transition}
            >
              {children}
              {showCloseButton ? (
                <DialogPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
                  <X className="size-4" weight="bold" />
                  <span className="sr-only">关闭</span>
                </DialogPrimitive.Close>
              ) : null}
            </motion.div>
          </DialogPrimitive.Content>
        ) : null}
      </AnimatePresence>
    </DialogPortal>
  )
}

function shouldPreventDialogDismiss(event: Event) {
  if (document.body.hasAttribute("data-image-preview-open")) {
    return true
  }

  if (isSelectContentOpen()) {
    return true
  }

  const currentTarget = event.currentTarget
  const target = getDismissableEventTarget(event)

  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest('[data-slot="select-content"]')) {
    return true
  }

  const targetDialog = target.closest('[data-slot="dialog-content"]')
  return Boolean(
    targetDialog &&
    currentTarget instanceof HTMLElement &&
    targetDialog !== currentTarget
  )
}

function getDismissableEventTarget(event: Event) {
  const detail = (event as CustomEvent<{ originalEvent?: Event }>).detail
  return detail?.originalEvent?.target ?? event.target
}

function isSelectContentOpen() {
  return Boolean(
    document.body.hasAttribute("data-select-dismiss-guard") ||
    document.body.hasAttribute("data-select-scroll-unlocked") ||
    document.querySelector('[data-slot="select-content"][data-state="open"]')
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
