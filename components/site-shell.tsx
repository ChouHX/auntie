"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { PageTransition } from "@/components/common/page-transition"
import { SiteHeadSync } from "@/components/common/site-head-sync"
import { MobileAppChrome } from "@/components/marketing/mobile-app-chrome"
import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"
import { I18nProvider } from "@/lib/i18n"

function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === "/"

  return (
    <I18nProvider>
      <div className="min-h-screen bg-[linear-gradient(180deg,#edf8ff_0%,#fbfdff_44%,#ffffff_100%)] text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:bg-none dark:text-white">
        <SiteHeadSync />
        <div className="hidden md:block">
          <SiteHeader />
        </div>
        <MobileAppChrome />
        <div
          className={
            isHome
              ? ""
              : "mobile-app-content pt-[60px] pb-[92px] md:pt-0 md:pb-0"
          }
        >
          {isHome ? children : <PageTransition>{children}</PageTransition>}
        </div>
        <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <SiteFooter />
        </div>
      </div>
    </I18nProvider>
  )
}

export { SiteShell }
