"use client"

import { usePathname } from "next/navigation"
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import {
  ClipboardText,
  CreditCard,
  HouseLine,
  Images,
  List,
  MoonStars,
  Sun,
  Translate,
  UserCircle,
  X,
} from "@phosphor-icons/react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useCmsContent } from "@/hooks/use-cms-content"
import { fetchPaymentOrder, isApiRequestError } from "@/lib/cms-api"
import { useI18n } from "@/lib/i18n"
import {
  localOrdersUpdatedEvent,
  readLocalPaymentOrders,
  removeLocalPaymentOrder,
  saveLocalPaymentOrder,
  type LocalPaymentOrder,
} from "@/lib/local-orders"
import { Link, useNavigate } from "@/lib/router-compat"
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
  orders: string
  payNow: string
  pendingDescription: string
  pendingTitle: string
}

const copyByLanguage: Record<"zh" | "en", MobileChromeCopy> = {
  zh: {
    contact: "客服",
    gallery: "画廊",
    home: "首页",
    orders: "订单",
    payNow: "去付款",
    pendingDescription: "您的订单正在等待付款确认",
    pendingTitle: "待付款订单",
  },
  en: {
    contact: "Support",
    gallery: "Gallery",
    home: "Home",
    orders: "Orders",
    payNow: "Pay now",
    pendingDescription: "Your order is waiting for payment.",
    pendingTitle: "Payment pending",
  },
}

const bottomTabs = [
  { icon: HouseLine, href: "/", key: "home" },
  { icon: Images, href: "/gallery", key: "gallery" },
  { icon: ClipboardText, href: "/orders", key: "orders" },
  { icon: UserCircle, href: "/about#contact", key: "contact" },
] as const

function MobileAppChrome({ children }: { children?: ReactNode }) {
  const pathname = usePathname() || "/"
  const { content } = useCmsContent(["siteSettings"])
  const { dict, language, toggleLanguage } = useI18n()
  const navigate = useNavigate()
  const { setTheme, theme } = useTheme()
  const copy = copyByLanguage[language]
  const logoImage = getSiteLogo(content)
  const isDarkTheme = theme === "dark"
  const [orders, setOrders] = useState<LocalPaymentOrder[]>([])
  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const activeOrder = useMemo(
    () =>
      orders.find(
        (order) => order.status === "unpaid" || order.status === "pending"
      ),
    [orders]
  )
  const isOrderRoute =
    pathname.startsWith("/orders") || pathname.startsWith("/pay")
  const activeOrderHref = activeOrder
    ? `/checkout?order=${encodeURIComponent(activeOrder.orderId)}`
    : "/orders"

  useEffect(() => {
    let cancelled = false

    const syncOrders = () => {
      const nextOrders = readLocalPaymentOrders()
      setOrders(nextOrders)
      setIsPromptVisible(
        nextOrders.some(
          (order) => order.status === "unpaid" || order.status === "pending"
        )
      )
    }

    async function validateOrders() {
      const cachedOrders = readLocalPaymentOrders()
      const activeOrders = cachedOrders.filter(
        (order) => order.status === "unpaid" || order.status === "pending"
      )

      setOrders(
        cachedOrders.filter(
          (order) => order.status !== "unpaid" && order.status !== "pending"
        )
      )
      setIsPromptVisible(false)

      await Promise.all(
        activeOrders.map(async (cachedOrder) => {
          try {
            saveLocalPaymentOrder(
              await fetchPaymentOrder(cachedOrder.orderId)
            )
          } catch (error) {
            if (isApiRequestError(error, 404)) {
              removeLocalPaymentOrder(cachedOrder.orderId)
            }
          }
        })
      )

      if (!cancelled) {
        syncOrders()
      }
    }

    const timeoutId = window.setTimeout(() => void validateOrders(), 0)
    window.addEventListener("storage", syncOrders)
    window.addEventListener(localOrdersUpdatedEvent, syncOrders)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      window.removeEventListener("storage", syncOrders)
      window.removeEventListener(localOrdersUpdatedEvent, syncOrders)
    }
  }, [])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const orderId =
      query.get("order")?.trim() || query.get("paymentOrder")?.trim() || ""

    if (!orderId) {
      return
    }

    let isMounted = true
    let redirected = false

    async function loadSharedOrder() {
      try {
        const order = await fetchPaymentOrder(orderId)

        if (!isMounted) {
          return
        }

        saveLocalPaymentOrder(order)

        if (order.status === "paid") {
          redirected = true
          navigate(
            order.review
              ? `/checkout?order=${encodeURIComponent(order.orderId)}`
              : `/review?order=${encodeURIComponent(order.orderId)}`,
            { replace: true }
          )
          return
        }

        if (order.status === "cancelled") {
          redirected = true
          navigate(`/checkout?order=${encodeURIComponent(order.orderId)}`, {
            replace: true,
          })
          return
        }

        setOrders(readLocalPaymentOrders())
        setIsPromptVisible(
          order.status === "unpaid" || order.status === "pending"
        )
      } catch (error) {
        if (isApiRequestError(error, 404)) {
          removeLocalPaymentOrder(orderId)
          setOrders(readLocalPaymentOrders())
          setIsPromptVisible(false)
        }
        // A stale or malformed shared link should still leave the visitor on home.
      } finally {
        if (!isMounted || redirected) {
          return
        }

        query.delete("order")
        query.delete("paymentOrder")
        const search = query.toString()
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`
        )
      }
    }

    void loadSharedOrder()

    return () => {
      isMounted = false
    }
  }, [navigate])

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
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/92 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
          <div className="relative z-10 mx-auto flex max-w-md items-center justify-between gap-3">
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- CMS logo can be a runtime-uploaded path or URL. */}
              <img
                src={logoImage}
                alt={`${dict.common.brandName} Logo`}
                className="size-9 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-white/10"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {dict.common.brandName}
                </div>
                <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {dict.common.brandSub}
                </div>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                aria-label={
                  isDarkTheme ? dict.common.themeLight : dict.common.themeDark
                }
                className="size-9 rounded-full"
                onClick={toggleTheme}
                size="icon"
                type="button"
                variant="navIcon"
              >
                {isDarkTheme ? <Sun size={18} /> : <MoonStars size={18} />}
              </Button>
              <Button
                aria-label={dict.common.languageLabel}
                className="relative size-9 rounded-full"
                onClick={toggleLanguage}
                size="icon"
                type="button"
                variant="navIcon"
              >
                <Translate size={18} />
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -bottom-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-slate-950 px-1 text-[9px] font-bold text-white dark:bg-white dark:text-slate-950"
                >
                  {language === "zh" ? "EN" : "中"}
                </span>
              </Button>
              <Button
                aria-expanded={isMenuOpen}
                aria-label={
                  isMenuOpen ? dict.common.menuClose : dict.common.menuOpen
                }
                className="size-9 rounded-full"
                onClick={() => setIsMenuOpen((open) => !open)}
                size="icon"
                type="button"
                variant="navIcon"
              >
                {isMenuOpen ? <X size={18} /> : <List size={19} />}
              </Button>
            </div>
          </div>
          <div
            aria-hidden={!isMenuOpen}
            className={cn(
              "relative z-10 -mx-4 mt-2 overflow-hidden bg-white shadow-lg transition-all duration-300 ease-out dark:bg-slate-950 dark:shadow-black/30",
              isMenuOpen
                ? "max-h-[34rem] border-t border-slate-200 opacity-100 dark:border-white/10"
                : "pointer-events-none max-h-0 border-t border-transparent opacity-0"
            )}
          >
            <nav className="mx-auto grid max-w-md gap-1 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              <MobileMenuItem
                label={copy.home}
                onClick={() => setIsMenuOpen(false)}
                to="/"
              />
              <MobileMenuItem
                label={copy.gallery}
                onClick={() => setIsMenuOpen(false)}
                to="/gallery"
              />
              <MobileMenuItem
                label={dict.nav.faq}
                onClick={() => setIsMenuOpen(false)}
                to="/faq"
              />
              <MobileMenuItem
                label={dict.nav.afterSales}
                onClick={() => setIsMenuOpen(false)}
                to="/after-sales"
              />
              <MobileMenuItem
                label={dict.nav.about}
                onClick={() => setIsMenuOpen(false)}
                to="/about"
              />
              <Button asChild className="mt-2" variant="brandStrong">
                <Link onClick={() => setIsMenuOpen(false)} to="/booking">
                  {dict.common.bookNow}
                </Link>
              </Button>
            </nav>
          </div>
        </header>
      </div>
      {activeOrder && isPromptVisible && !isOrderRoute ? (
        <div className="fixed inset-x-3 bottom-[calc(4.7rem+env(safe-area-inset-bottom))] z-40 md:right-6 md:bottom-6 md:left-auto md:w-[360px]">
          <div className="rounded-xl border border-slate-200 bg-white/96 p-3 shadow-xl shadow-slate-950/15 backdrop-blur dark:border-white/10 dark:bg-slate-950/96">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CreditCard size={18} weight="fill" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{copy.pendingTitle}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {copy.pendingDescription}
                </div>
                <div className="mt-1.5 truncate text-xs font-medium">
                  {activeOrder.orderId}
                </div>
              </div>
              <Button
                aria-label="Close"
                className="size-8 shrink-0 rounded-md"
                onClick={() => setIsPromptVisible(false)}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <X size={16} />
              </Button>
            </div>
            <Button
              asChild
              className="mt-3 h-8 w-full rounded-md text-xs"
              size="sm"
            >
              <Link to={activeOrderHref}>
                <CreditCard size={15} weight="fill" />
                {copy.payNow}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
      {activeOrder && !isPromptVisible && !isOrderRoute ? (
        <Link
          aria-label={copy.pendingTitle}
          className="mobile-order-nudge fixed right-4 bottom-[calc(4.2rem+env(safe-area-inset-bottom))] z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 shadow-primary/30 ring-background md:right-6 md:bottom-6"
          to={activeOrderHref}
        >
          <CreditCard size={20} weight="fill" />
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white ring-2 ring-background">
            1
          </span>
        </Link>
      ) : null}
      <MobileBottomTabs
        activeOrder={activeOrder}
        copy={copy}
        pathname={pathname}
      />
    </>
  )
}

function MobileMenuItem({
  label,
  onClick,
  to,
}: {
  label: string
  onClick: () => void
  to: string
}) {
  return (
    <Link
      className="rounded-md px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"
      onClick={onClick}
      to={to}
    >
      {label}
    </Link>
  )
}

function MobileBottomTabs({
  activeOrder,
  copy,
  pathname,
}: {
  activeOrder?: LocalPaymentOrder
  copy: MobileChromeCopy
  pathname: string
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/96 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-900/94">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 pt-1 pb-[max(6px,env(safe-area-inset-bottom))]">
        {bottomTabs.map((tab) => (
          <BottomTab
            key={tab.key}
            active={isActiveTab(tab.key, tab.href, pathname)}
            hasPendingOrder={tab.key === "orders" && Boolean(activeOrder)}
            href={tab.href}
            icon={tab.icon}
            label={getBottomTabLabel(tab.key, copy)}
          />
        ))}
      </div>
    </nav>
  )
}

function BottomTab({
  active,
  hasPendingOrder,
  href,
  icon: Icon,
  label,
}: {
  active?: boolean
  hasPendingOrder: boolean
  href: string
  icon: IconType
  label: string
}) {
  return (
    <Link
      to={href}
      className={cn(
        "relative flex min-h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[10px] font-medium text-slate-500 transition dark:text-slate-400",
        active &&
          "bg-primary/8 text-primary dark:bg-blue-400/10 dark:text-blue-300"
      )}
    >
      <Icon size={21} weight={active ? "fill" : "regular"} />
      <span className="truncate">{label}</span>
      {hasPendingOrder ? (
        <span className="absolute top-1 right-[27%] size-2 rounded-full bg-red-500" />
      ) : null}
    </Link>
  )
}

function getBottomTabLabel(
  key: (typeof bottomTabs)[number]["key"],
  copy: MobileChromeCopy
) {
  switch (key) {
    case "home":
      return copy.home
    case "gallery":
      return copy.gallery
    case "orders":
      return copy.orders
    case "contact":
      return copy.contact
  }
}

function isActiveTab(
  key: (typeof bottomTabs)[number]["key"],
  href: string,
  pathname: string
) {
  const path = href.split("#")[0] || "/"

  if (path === "/") {
    return pathname === "/"
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

export { MobileAppChrome }
