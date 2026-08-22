"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import {
  CalendarDays,
  Clock3,
  CreditCard,
  MapPin,
  ReceiptText,
  Star,
  UserRound,
} from "lucide-react"

import {
  type CachedPaymentOrder,
  isActiveCachedPaymentOrder,
  readCachedPaymentOrders,
  reconcileCachedPaymentOrders,
} from "@/lib/client-payment-orders"
import { fetchPaymentOrder, isApiRequestError } from "@/lib/cms-api"
import { useI18n } from "@/lib/i18n"
import { Link } from "@/lib/router-compat"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function OrdersPage() {
  const { dict } = useI18n()
  const [orders, setOrders] = useState<CachedPaymentOrder[]>([])

  useEffect(() => {
    let cancelled = false
    let isRefreshing = false

    async function refreshOrders() {
      if (cancelled || isRefreshing || document.hidden) return
      isRefreshing = true
      const cachedOrders = readCachedPaymentOrders()

      setOrders(
        cachedOrders.filter((order) => !isActiveCachedPaymentOrder(order))
      )
      try {
        const nextOrders = await reconcileCachedPaymentOrders(
          fetchPaymentOrder,
          (error) => isApiRequestError(error, 404)
        )
        if (!cancelled) {
          setOrders(nextOrders)
        }
      } finally {
        isRefreshing = false
      }
    }

    const refreshWhenVisible = () => void refreshOrders()
    void refreshOrders()
    const intervalId = window.setInterval(refreshWhenVisible, 5000)
    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [])

  return (
    <main className="pt-[60px] md:pt-[72px]">
      <section className="mx-auto flex min-h-[calc(100svh-60px)] max-w-3xl flex-col px-4 py-5 sm:px-6 md:min-h-[calc(100svh-72px)] md:py-12">
        <h1 className="text-xl font-semibold tracking-normal text-slate-950 dark:text-white">
          {dict.ordersPage.title}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {dict.ordersPage.description} · {dict.ordersPage.localOnly}
        </p>

        {orders.length ? (
          <div className="mt-4 flex flex-col gap-2.5">
            {orders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </div>
        ) : (
          <Card className="mt-4 rounded-lg">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ReceiptText aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {dict.ordersPage.emptyTitle}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dict.ordersPage.emptyText}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}

function OrderCard({ order }: { order: CachedPaymentOrder }) {
  const { dict } = useI18n()
  const isActive = isActiveCachedPaymentOrder(order)
  const isZelleReviewPending =
    order.hasZellePaymentProof && order.status !== "paid"
  const canReviewZelleOrder =
    order.hasZellePaymentProof && order.status === "paid"
  const statusLabel = isZelleReviewPending
    ? dict.ordersPage.reviewPending
    : dict.ordersPage.status[order.status]
  const actionLabel = isZelleReviewPending
    ? dict.ordersPage.viewReviewProgress
    : canReviewZelleOrder
      ? dict.ordersPage.reviewOrder
      : isActive
        ? dict.ordersPage.payNow
        : dict.ordersPage.viewOrder
  const orderHref = canReviewZelleOrder
    ? `/review?order=${encodeURIComponent(order.orderId)}`
    : `/checkout?order=${encodeURIComponent(order.orderId)}`

  return (
    <Card className="overflow-hidden rounded-lg border-border/80 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-foreground">
              {order.orderId}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" />
              <span className="truncate">
                {order.serviceDate || dict.ordersPage.serviceDate}
              </span>
            </div>
          </div>
          <Badge
            className={cn(
              "shrink-0 px-2 py-1 text-[11px]",
              isZelleReviewPending
                ? "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200"
                : isActive && "border-transparent bg-amber-100 text-amber-700"
            )}
            variant={isActive && !isZelleReviewPending ? "amber" : "secondary"}
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              {dict.ordersPage.amount}
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {order.amount || order.currency || "-"}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <OrderMeta
              icon={<ReceiptText className="size-3.5" />}
              label={dict.ordersPage.serviceType}
              value={order.serviceType || "-"}
            />
            <OrderMeta
              icon={<MapPin className="size-3.5" />}
              label={dict.ordersPage.serviceArea}
              value={order.serviceArea || "-"}
            />
            <OrderMeta
              icon={<UserRound className="size-3.5" />}
              label={dict.ordersPage.customer}
              value={order.customerName || "-"}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-muted/25 px-3 py-2">
          <Button
            asChild
            className="h-8 shrink-0 px-3 text-xs"
            variant={isActive ? "default" : "outline"}
          >
            <Link to={orderHref}>
              {isZelleReviewPending ? (
                <Clock3 data-icon="inline-start" />
              ) : canReviewZelleOrder ? (
                <Star data-icon="inline-start" />
              ) : (
                <CreditCard data-icon="inline-start" />
              )}
              {actionLabel}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrderMeta({
  className,
  icon,
  label,
  value,
}: {
  className?: string
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className={cn("flex min-w-0 items-start gap-1.5", className)}>
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] text-muted-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-foreground">{value}</span>
      </span>
    </div>
  )
}

export { OrdersPage }
