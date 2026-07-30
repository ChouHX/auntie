"use client"

import { useEffect, useState } from "react"
import { CreditCard, ReceiptText } from "lucide-react"

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
    const timeoutId = window.setTimeout(() => {
      const cachedOrders = readCachedPaymentOrders()

      setOrders(
        cachedOrders.filter((order) => !isActiveCachedPaymentOrder(order))
      )
      void reconcileCachedPaymentOrders(
        fetchPaymentOrder,
        (error) => isApiRequestError(error, 404)
      ).then((nextOrders) => {
        if (!cancelled) {
          setOrders(nextOrders)
        }
      })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <main className="pt-[60px] md:pt-[72px]">
      <section className="mx-auto flex min-h-[calc(100svh-60px)] max-w-3xl flex-col px-4 py-5 sm:px-6 md:min-h-[calc(100svh-72px)] md:py-12">
        <h1 className="text-xl font-semibold tracking-normal text-slate-950 dark:text-white">
          {dict.ordersPage.title}
        </h1>

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
  const statusLabel = dict.ordersPage.status[order.status]
  const actionLabel = isActive
    ? dict.ordersPage.payNow
    : dict.ordersPage.viewOrder
  const orderHref = `/checkout?order=${encodeURIComponent(order.orderId)}`

  return (
    <Card className="rounded-lg">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {order.serviceType || order.orderId}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {order.serviceDate || order.serviceArea || order.orderId}
            </div>
          </div>
          <Badge
            className={cn(
              "shrink-0 px-2 py-1 text-[11px]",
              isActive && "border-transparent bg-amber-100 text-amber-700"
            )}
            variant={isActive ? "amber" : "secondary"}
          >
            {statusLabel}
          </Badge>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/70 pt-2">
          <span className="truncate text-xs text-muted-foreground">
            {order.serviceArea || order.orderId}
          </span>
          <span className="shrink-0 text-sm font-semibold text-foreground">
            {order.amount || order.currency || "-"}
          </span>
        </div>
        <Button
          asChild
          className="mt-3 h-9 w-full text-xs"
          variant={isActive ? "default" : "outline"}
        >
          <Link to={orderHref}>
            <CreditCard data-icon="inline-start" />
            {actionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export { OrdersPage }
