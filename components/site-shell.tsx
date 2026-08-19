"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { PageTransition } from "@/components/common/page-transition"
import { SiteHeadSync } from "@/components/common/site-head-sync"
import { MobileAppChrome } from "@/components/marketing/mobile-app-chrome"
import { MobileAppDock } from "@/components/marketing/mobile-app-dock"
import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"
import { I18nProvider } from "@/lib/i18n"

function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin =
    pathname?.startsWith("/admin") || pathname?.startsWith("/sales")
  const isCheckout = pathname === "/checkout" || pathname === "/pay"
  const isHome = pathname === "/"

  if (isAdmin) {
    return (
      <I18nProvider>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </I18nProvider>
    )
  }

  if (isCheckout) {
    return (
      <I18nProvider>
        <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
          <SiteHeadSync />
          {children}
        </div>
      </I18nProvider>
    )
  }

  return (
    <I18nProvider>
      <div
        className={`min-h-screen bg-[linear-gradient(180deg,#edf8ff_0%,#fbfdff_44%,#ffffff_100%)] text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:bg-none dark:text-white ${isHome ? "" : "pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0"}`}
      >
        <SiteHeadSync />
        {isHome ? (
          <>
            <div className="hidden md:block">
              <SiteHeader />
            </div>
            <MobileAppChrome />
            {children}
            <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
              <SiteFooter />
            </div>
          </>
        ) : (
          <>
            <SiteHeader />
            <PageTransition>{children}</PageTransition>
            <MobileAppDock />
            <SiteFooter />
          </>
        )}
      </div>
    </I18nProvider>
  )
}

export { SiteShell }
