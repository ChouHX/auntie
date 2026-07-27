"use client"

import { type ReactNode, useRef, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AdminNoticeDialogState = {
  cancelLabel?: string
  confirmLabel: string
  description?: ReactNode
  kind: "alert" | "confirm"
  title: string
  variant?: "default" | "destructive"
}

export type AdminNoticeDialogOptions = {
  cancelLabel?: string
  confirmLabel?: string
  description?: ReactNode
  title: string
  variant?: "default" | "destructive"
}

export function useAdminNoticeDialog() {
  const [dialog, setDialog] = useState<AdminNoticeDialogState | null>(null)
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  function openDialog(
    kind: AdminNoticeDialogState["kind"],
    options: AdminNoticeDialogOptions
  ) {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setDialog({
        confirmLabel: kind === "confirm" ? "确认" : "知道了",
        kind,
        ...options,
      })
    })
  }

  function resolveDialog(confirmed: boolean) {
    resolverRef.current?.(confirmed)
    resolverRef.current = null
    setDialog(null)
  }

  async function showAlert(options: AdminNoticeDialogOptions) {
    await openDialog("alert", options)
  }

  function confirmAction(options: AdminNoticeDialogOptions) {
    return openDialog("confirm", {
      cancelLabel: "取消",
      confirmLabel: "确认",
      variant: "destructive",
      ...options,
    })
  }

  const noticeDialog = (
    <AdminNoticeDialog
      dialog={dialog}
      onOpenChange={(open) => {
        if (!open) {
          resolveDialog(false)
        }
      }}
      onResolve={resolveDialog}
    />
  )

  return { confirmAction, noticeDialog, showAlert }
}

export function AdminNoticeDialog({
  dialog,
  onOpenChange,
  onResolve,
}: {
  dialog: AdminNoticeDialogState | null
  onOpenChange: (open: boolean) => void
  onResolve: (confirmed: boolean) => void
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={Boolean(dialog)}>
      {dialog ? (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            {dialog.description ? (
              <AlertDialogDescription>
                {dialog.description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {dialog.kind === "confirm" ? (
              <AlertDialogCancel onClick={() => onResolve(false)}>
                {dialog.cancelLabel ?? "取消"}
              </AlertDialogCancel>
            ) : null}
            <AlertDialogAction
              className={cn(
                dialog.variant === "destructive" &&
                  "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              )}
              onClick={() => onResolve(true)}
            >
              {dialog.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  )
}
