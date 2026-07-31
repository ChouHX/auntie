"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme()
  const {
    className,
    position = "top-right",
    richColors = true,
    toastOptions,
    ...toasterProps
  } = props

  return (
    <Sonner
      {...toasterProps}
      className={cn("toaster group", className)}
      closeButton={false}
      position={position}
      richColors={richColors}
      swipeDirections={["right"]}
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        ...toastOptions,
        closeButton: false,
        classNames: {
          actionButton:
            "!h-8 !rounded-md !bg-foreground !px-3 !text-xs !font-medium !text-background",
          cancelButton:
            "!h-8 !rounded-md !bg-muted !px-3 !text-xs !font-medium !text-foreground",
          content: "!gap-0.5",
          description: "!text-xs !leading-5 !text-muted-foreground",
          error:
            "!border-l-[3px] !border-l-red-500 [&_[data-icon]]:!text-red-600",
          icon: "!mr-1 !size-5",
          info: "!border-l-[3px] !border-l-sky-500 [&_[data-icon]]:!text-sky-600",
          loading:
            "!border-l-[3px] !border-l-slate-400 [&_[data-icon]]:!text-slate-500",
          success:
            "!border-l-[3px] !border-l-emerald-500 [&_[data-icon]]:!text-emerald-600",
          title: "!text-sm !font-medium !leading-5",
          toast:
            "group toast !rounded-lg !border !border-border !bg-background !px-4 !py-3 !text-foreground !shadow-[0_12px_32px_rgba(15,23,42,0.14)] dark:!shadow-[0_12px_32px_rgba(0,0,0,0.38)]",
          warning:
            "!border-l-[3px] !border-l-amber-500 [&_[data-icon]]:!text-amber-600",
          ...toastOptions?.classNames,
        },
      }}
    />
  )
}

export { Toaster }
