import type { Metadata } from "next"
import { Suspense, type ReactNode } from "react"

import "./globals.css"
import { SiteShell } from "@/components/site-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "陈阿姨到家｜海外华人家庭清洁与家政服务",
  description:
    "陈阿姨到家为海外华人家庭提供日常清洁、深度清洁、退租清洁、开荒清洁等服务，预约前先确认范围与报价。",
  icons: {
    icon: "/logo.webp",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Suspense fallback={null}>
            <SiteShell>{children}</SiteShell>
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
