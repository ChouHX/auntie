"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CreditCard,
  Images,
  Home,
  MessageCircle,
  ReceiptText,
  X,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  type CachedPaymentOrder,
  isActiveCachedPaymentOrder,
  readCachedPaymentOrders,
  reconcileCachedPaymentOrders,
  removeCachedPaymentOrder,
  upsertCachedPaymentOrder,
} from "@/lib/client-payment-orders"
import { fetchPaymentOrder, isApiRequestError } from "@/lib/cms-api"
import { useI18n } from "@/lib/i18n"
import { Link } from "@/lib/router-compat"
import { cn } from "@/lib/utils"

function MobileAppDock() {
  const pathname = usePathname() || "/"
  const { dict } = useI18n()
  const [orders, setOrders] = useState<CachedPaymentOrder[]>([])
  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const activeOrder = useMemo(
    () => orders.find(isActiveCachedPaymentOrder),
    [orders]
  )
  const isOrderRoute =
    pathname.startsWith("/orders") ||
    pathname.startsWith("/pay") ||
    pathname.startsWith("/review")
  const shouldShowOrderPrompt = isPromptVisible && activeOrder && !isOrderRoute
  const activeOrderHref = activeOrder
    ? `/checkout?order=${encodeURIComponent(activeOrder.orderId)}`
    : "/orders"
  const navItems = [
    {
      href: "/",
      icon: Home,
      isActive: pathname === "/",
      label: dict.mobileApp.tabs.home,
    },
    {
      href: "/gallery",
      icon: Images,
      isActive: pathname.startsWith("/gallery"),
      label: dict.nav.gallery,
    },
    {
      href: "/orders",
      icon: ReceiptText,
      isActive: pathname.startsWith("/orders") || pathname.startsWith("/pay"),
      label: dict.mobileApp.tabs.orders,
    },
    {
      href: "/about#contact",
      icon: MessageCircle,
      isActive: pathname.startsWith("/about"),
      label: dict.mobileApp.tabs.contact,
    },
  ]

  const cacheRemoteOrder = useCallback(
    async (orderId: string, openPrompt: boolean) => {
      try {
        const order = await fetchPaymentOrder(orderId)
        const nextOrders = upsertCachedPaymentOrder(order)
        const cachedOrder = nextOrders.find((item) => item.orderId === orderId)

        setOrders(nextOrders)

        if (
          openPrompt &&
          cachedOrder &&
          isActiveCachedPaymentOrder(cachedOrder)
        ) {
          setIsPromptVisible(true)
        }
      } catch (error) {
        const nextOrders = isApiRequestError(error, 404)
          ? removeCachedPaymentOrder(orderId)
          : readCachedPaymentOrders()

        setOrders(nextOrders)
        setIsPromptVisible(
          openPrompt && nextOrders.some(isActiveCachedPaymentOrder)
        )
      }
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      const cachedOrders = readCachedPaymentOrders()
      const cachedActiveOrder = cachedOrders.find(isActiveCachedPaymentOrder)
      const query = new URLSearchParams(window.location.search)
      const incomingOrderId =
        query.get("order")?.trim() || query.get("paymentOrder")?.trim() || ""

      if (incomingOrderId && isOrderRoute) {
        setOrders(cachedOrders)
        return
      }

      if (incomingOrderId) {
        setOrders(
          cachedOrders.filter((order) => !isActiveCachedPaymentOrder(order))
        )
        void cacheRemoteOrder(incomingOrderId, true)
        query.delete("order")
        query.delete("paymentOrder")

        const search = query.toString()
        const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`
        window.history.replaceState(null, "", nextUrl)
        return
      }

      if (cachedActiveOrder) {
        setOrders(
          cachedOrders.filter((order) => !isActiveCachedPaymentOrder(order))
        )
        void reconcileCachedPaymentOrders(
          fetchPaymentOrder,
          (error) => isApiRequestError(error, 404)
        ).then((nextOrders) => {
          if (!cancelled) {
            setOrders(nextOrders)
            setIsPromptVisible(nextOrders.some(isActiveCachedPaymentOrder))
          }
        })
        return
      }

      setOrders(cachedOrders)
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [cacheRemoteOrder, isOrderRoute])

  return (
    <>
      {shouldShowOrderPrompt ? (
        <div
          aria-live="polite"
          className="fixed inset-x-3 bottom-[calc(5.15rem+env(safe-area-inset-bottom))] z-40 md:right-6 md:bottom-6 md:left-auto md:w-[360px]"
        >
          <div className="rounded-xl border border-border bg-card/96 p-3 text-card-foreground shadow-xl shadow-slate-950/15 backdrop-blur dark:bg-slate-950/96 dark:shadow-black/35">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <CreditCard aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {dict.mobileApp.pendingTitle}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {dict.mobileApp.pendingDescription}
                </div>
                <div className="mt-2 flex min-w-0 items-center gap-2 text-xs">
                  <span className="truncate font-medium">
                    {activeOrder.serviceType || activeOrder.orderId}
                  </span>
                  {activeOrder.amount ? (
                    <span className="shrink-0 font-semibold text-primary">
                      {activeOrder.amount}
                    </span>
                  ) : null}
                </div>
              </div>
              <Button
                aria-label={dict.mobileApp.closePending}
                className="size-8 shrink-0 rounded-md"
                onClick={() => setIsPromptVisible(false)}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <X />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Link
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                to="/orders"
              >
                {activeOrder.orderId}
              </Link>
              <Button asChild className="h-9 px-4" size="sm">
                <Link to={activeOrderHref}>
                  <CreditCard data-icon="inline-start" />
                  {dict.mobileApp.payNow}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {activeOrder && !isPromptVisible && !isOrderRoute ? (
        <>
          <Link
            aria-label={dict.mobileApp.pendingTitle}
            className="mobile-order-nudge fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 shadow-primary/30 ring-background md:right-6 md:bottom-6"
            to={activeOrderHref}
          >
            <CreditCard aria-hidden="true" />
            <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white ring-2 ring-background">
              1
            </span>
          </Link>
        </>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/96 px-2 pt-1 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_-10px_28px_rgba(15,23,42,0.08)] backdrop-blur md:hidden dark:bg-slate-950/96 dark:shadow-black/30">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <Link
                className={cn(
                  "relative flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[10px] font-medium text-muted-foreground transition",
                  item.isActive && "bg-muted text-foreground"
                )}
                key={item.href}
                to={item.href}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span>{item.label}</span>
                {item.href === "/orders" && activeOrder ? (
                  <span className="absolute top-1 right-[26%] size-2 rounded-full bg-destructive" />
                ) : null}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export { MobileAppDock }
