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
      <head>
        {/* Google Tag Manager */}
        <script
          id="google-tag-manager"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TL69F6TD');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TL69F6TD"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
