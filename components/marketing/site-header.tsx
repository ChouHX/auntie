import { useEffect, useState } from "react"
import {
  ArrowRight,
  List,
  MoonStars,
  Sun,
  Translate,
  X,
} from "@phosphor-icons/react"
import { Link, NavLink } from "@/lib/router-compat"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"
import { getSiteLogo } from "@/lib/site-settings"
import { cn } from "@/lib/utils"

const navLinks = [
  { key: "home", href: "/" },
  { key: "gallery", href: "/gallery" },
  { key: "faq", href: "/faq" },
  { key: "afterSales", href: "/after-sales" },
  { key: "join", href: "/join" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const { content } = useCmsContent()
  const { dict, language, toggleLanguage } = useI18n()
  const isDarkTheme = theme === "dark"
  const logoImage = getSiteLogo(content)

  function toggleTheme() {
    setTheme(isDarkTheme ? "light" : "dark")
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMenuOpen])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-white/94 text-slate-950 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-950/96 dark:text-white">
      <button
        aria-hidden="true"
        className={cn(
          "fixed inset-x-0 top-[72px] bottom-0 z-0 bg-slate-950/20 transition-opacity duration-300 lg:hidden dark:bg-slate-950/55",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsMenuOpen(false)}
        tabIndex={-1}
        type="button"
      />
      <div className="relative z-10 mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-2 rounded-2xl px-1.5 py-1 transition duration-300 hover:bg-slate-100 min-[420px]:gap-3 dark:hover:bg-white/[0.06]"
          onClick={() => setIsMenuOpen(false)}
        >
          <img
            src={logoImage}
            alt={`${dict.common.brandName} Logo`}
            className="size-9 shrink-0 rounded-xl border border-border object-cover min-[420px]:size-10 dark:border-white/10"
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-semibold tracking-wide min-[420px]:text-sm">
              {dict.common.brandName}
            </div>
            <div className="hidden text-[11px] text-slate-500 min-[420px]:block dark:text-slate-400">
              {dict.common.brandSub}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 lg:flex dark:text-slate-300">
          {navLinks.map((item) => (
            <HeaderNavItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 min-[420px]:gap-2">
          <Button
            aria-label={dict.common.languageLabel}
            className="relative size-9 min-[420px]:size-10"
            onClick={toggleLanguage}
            size="icon"
            type="button"
            variant="navIcon"
          >
            <Translate size={17} />
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -bottom-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] leading-none font-bold text-white shadow-sm dark:bg-white dark:text-slate-950"
            >
              {language === "zh" ? "EN" : "中"}
            </span>
          </Button>
          <Button
            aria-label={
              isDarkTheme ? dict.common.themeLight : dict.common.themeDark
            }
            className="size-9 min-[420px]:size-10"
            onClick={toggleTheme}
            size="icon"
            type="button"
            variant="navIcon"
          >
            {isDarkTheme ? <Sun size={18} /> : <MoonStars size={18} />}
          </Button>
          <Button
            asChild
            className="hidden px-5 md:inline-flex"
            variant="brand"
          >
            <Link to="/booking">
              {dict.common.bookNow} <ArrowRight weight="bold" />
            </Link>
          </Button>
          <Button
            aria-expanded={isMenuOpen}
            aria-label={
              isMenuOpen ? dict.common.menuClose : dict.common.menuOpen
            }
            className="relative size-10 overflow-hidden lg:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            size="icon"
            type="button"
            variant="navMenu"
          >
            <List
              className={cn(
                "absolute transition duration-300",
                isMenuOpen
                  ? "scale-75 rotate-90 opacity-0"
                  : "scale-100 rotate-0 opacity-100"
              )}
              size={20}
            />
            <X
              className={cn(
                "absolute transition duration-300",
                isMenuOpen
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-75 -rotate-90 opacity-0"
              )}
              size={20}
            />
          </Button>
        </div>
      </div>

      <div
        aria-hidden={!isMenuOpen}
        className={cn(
          "relative z-10 overflow-hidden bg-white shadow-lg transition-all duration-300 ease-out lg:hidden dark:bg-slate-950 dark:shadow-black/30",
          isMenuOpen
            ? "max-h-[620px] border-t border-border opacity-100 dark:border-white/10"
            : "max-h-0 border-t border-transparent opacity-0"
        )}
      >
        <nav
          className={cn(
            "mx-auto grid max-w-7xl gap-1 px-4 py-3 text-sm font-medium text-slate-700 transition duration-300 sm:px-6 dark:text-slate-200",
            isMenuOpen ? "translate-y-0" : "-translate-y-2"
          )}
        >
          {navLinks.map((item, index) => (
            <MobileHeaderNavItem
              key={item.href}
              index={index}
              isMenuOpen={isMenuOpen}
              item={item}
              onClick={() => setIsMenuOpen(false)}
            />
          ))}
          <Button asChild className="mt-2" variant="brandStrong">
            <Link
              onClick={() => setIsMenuOpen(false)}
              tabIndex={isMenuOpen ? undefined : -1}
              to="/booking"
            >
              {dict.common.bookNow}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

type HeaderNavItemProps = {
  item: (typeof navLinks)[number]
}

function HeaderNavItem({ item }: HeaderNavItemProps) {
  const { dict } = useI18n()
  const baseClassName = cn(
    "relative rounded-sm px-3 py-2 transition duration-300 hover:text-primary",
    "after:absolute after:right-3 after:bottom-1.5 after:left-3 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100 dark:after:bg-blue-300 dark:hover:text-blue-200"
  )

  if (item.href.includes("#")) {
    return (
      <Link className={baseClassName} to={item.href}>
        {dict.nav[item.key]}
      </Link>
    )
  }

  return (
    <NavLink
      end={item.href === "/"}
      to={item.href}
      className={({ isActive }) =>
        cn(
          baseClassName,
          isActive && "text-primary after:scale-x-100 dark:text-blue-200"
        )
      }
    >
      {dict.nav[item.key]}
    </NavLink>
  )
}

type MobileHeaderNavItemProps = HeaderNavItemProps & {
  index: number
  isMenuOpen: boolean
  onClick: () => void
}

function MobileHeaderNavItem({
  index,
  isMenuOpen,
  item,
  onClick,
}: MobileHeaderNavItemProps) {
  const { dict } = useI18n()
  const baseClassName = cn(
    "relative rounded-md px-3 py-3 transition duration-300 before:absolute before:top-3 before:bottom-3 before:left-0 before:w-0.5 before:origin-top before:scale-y-0 before:rounded-full before:bg-primary before:transition-transform before:duration-300 hover:text-primary dark:before:bg-blue-300 dark:hover:text-blue-200",
    isMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
  )
  const style = {
    transitionDelay: isMenuOpen ? `${index * 35}ms` : "0ms",
  }

  if (item.href.includes("#")) {
    return (
      <Link
        className={baseClassName}
        onClick={onClick}
        style={style}
        tabIndex={isMenuOpen ? undefined : -1}
        to={item.href}
      >
        {dict.nav[item.key]}
      </Link>
    )
  }

  return (
    <NavLink
      end={item.href === "/"}
      onClick={onClick}
      style={style}
      tabIndex={isMenuOpen ? undefined : -1}
      to={item.href}
      className={({ isActive }) =>
        cn(
          baseClassName,
          isActive && "text-primary before:scale-y-100 dark:text-blue-200"
        )
      }
    >
      {dict.nav[item.key]}
    </NavLink>
  )
}
