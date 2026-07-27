import type { Metadata } from "next"
import { Suspense, type ReactNode } from "react"

import "./globals.css"
import { SiteShell } from "@/components/site-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const siteTitle = "陈阿姨到家｜品质有保障、售后无忧的华人清洁品牌"
const siteDescription =
  "陈阿姨到家：服务介绍、预约说明、售后与政策信息。从阿姨安排、价格说明到服务验收，把大家最关心的问题写清楚。"
const siteName = "陈阿姨到家"
const siteLogo = "/logo.webp"

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName,
    images: [
      {
        url: siteLogo,
        width: 500,
        height: 500,
        alt: siteName,
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
    images: [siteLogo],
  },
  icons: {
    icon: siteLogo,
  },
}

function getSiteMetadataBase() {
  const siteUrl =
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://example.com"
  const normalizedSiteUrl = /^https?:\/\//i.test(siteUrl)
    ? siteUrl
    : `https://${siteUrl}`

  try {
    return new URL(normalizedSiteUrl)
  } catch {
    return new URL("https://example.com")
  }
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
