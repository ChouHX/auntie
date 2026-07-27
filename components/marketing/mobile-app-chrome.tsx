"use client"

import { usePathname } from "next/navigation"
import { useState, type ComponentType, type ReactNode } from "react"
import {
  HouseLine,
  Images,
  List,
  MoonStars,
  PhoneCall,
  Sun,
  Translate,
  UserCircle,
  X,
} from "@phosphor-icons/react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"
import { Link } from "@/lib/router-compat"
import { getSiteLogo } from "@/lib/site-settings"
import { cn } from "@/lib/utils"

type IconType = ComponentType<{
  className?: string
  size?: number
  weight?: "bold" | "duotone" | "fill" | "light" | "regular" | "thin"
}>

type MobileChromeCopy = {
  contact: string
  gallery: string
  home: string
  services: string
}

const copyByLanguage: Record<"zh" | "en", MobileChromeCopy> = {
  zh: {
    contact: "客服",
    gallery: "画廊",
    home: "首页",
    services: "服务",
  },
  en: {
    contact: "Support",
    gallery: "Gallery",
    home: "Home",
    services: "Services",
  },
}

const bottomTabs = [
  { icon: HouseLine, href: "/", key: "home" },
  { icon: Images, href: "/gallery", key: "gallery" },
  { icon: PhoneCall, href: "/booking", key: "services" },
  { icon: UserCircle, href: "/contact", key: "contact" },
] as const

function MobileAppChrome({ children }: { children?: ReactNode }) {
  const pathname = usePathname() || "/"
  const { content } = useCmsContent()
  const { dict, language, toggleLanguage } = useI18n()
  const { setTheme, theme } = useTheme()
  const copy = copyByLanguage[language]
  const logoImage = getSiteLogo(content)
  const isDarkTheme = theme === "dark"
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function toggleTheme() {
    setTheme(isDarkTheme ? "light" : "dark")
  }

  return (
    <>
      {children ? <div className="md:hidden">{children}</div> : null}
      <div className="md:hidden">
        <button
          aria-hidden="true"
          className={cn(
            "fixed inset-x-0 top-[60px] bottom-0 z-40 bg-slate-950/20 transition-opacity duration-300 dark:bg-slate-950/55",
            isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsMenuOpen(false)}
          tabIndex={-1}
          type="button"
        />

        <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-100/80 bg-white/92 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
          <div className="flex h-[60px] items-center justify-between gap-3 px-4">
            <Link className="flex min-w-0 items-center gap-2.5" to="/">
              <img
                alt={dict.common.brandName}
                className="size-9 rounded-md bg-white object-cover shadow-sm ring-1 ring-blue-100 dark:bg-white/10 dark:ring-white/10"
                src={logoImage}
              />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {dict.common.brandName}
                </div>
                <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {dict.common.brandSub}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              <Button
                aria-label={dict.common.languageLabel}
                className="size-9 rounded-full"
                onClick={toggleLanguage}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Translate size={18} weight="bold" />
              </Button>
              <Button
                aria-label={isDarkTheme ? dict.common.themeLight : dict.common.themeDark}
                className="size-9 rounded-full"
                onClick={toggleTheme}
                size="icon"
                type="button"
                variant="ghost"
              >
                {isDarkTheme ? (
                  <Sun size={18} weight="bold" />
                ) : (
                  <MoonStars size={18} weight="bold" />
                )}
              </Button>
              <Button
                aria-label={isMenuOpen ? dict.common.menuClose : dict.common.menuOpen}
                className="size-9 rounded-full"
                onClick={() => setIsMenuOpen((open) => !open)}
                size="icon"
                type="button"
                variant="ghost"
              >
                {isMenuOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
              </Button>
            </div>
          </div>

          <nav
            className={cn(
              "overflow-hidden border-t border-blue-100/80 bg-white/96 transition-[max-height,opacity] duration-300 dark:border-white/10 dark:bg-slate-950/96",
              isMenuOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="grid gap-1 px-3 py-3">
              {dict.nav && [
                { label: dict.nav.home, to: "/" },
                { label: dict.nav.gallery, to: "/gallery" },
                { label: dict.nav.faq, to: "/faq" },
                { label: dict.nav.afterSales, to: "/after-sales" },
                { label: dict.nav.join, to: "/join" },
                { label: dict.nav.about, to: "/about" },
                { label: dict.nav.contact, to: "/contact" },
              ].map((item) => (
                <Link
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    pathname === item.to
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  )}
                  to={item.to}
                  key={item.to}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-100/80 bg-white/94 px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92">
          <div className="grid grid-cols-4 gap-1">
            {bottomTabs.map((tab) => {
              const Icon = tab.icon as IconType
              const label = copy[tab.key]
              const active =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`)

              return (
                <Link
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition",
                    active
                      ? "text-blue-700 dark:text-blue-200"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                  to={tab.href}
                  key={tab.key}
                >
                  <Icon size={20} weight={active ? "fill" : "regular"} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}

export { MobileAppChrome }
