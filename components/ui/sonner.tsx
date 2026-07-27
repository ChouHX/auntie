"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useTheme } from "@/components/theme-provider"

function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
