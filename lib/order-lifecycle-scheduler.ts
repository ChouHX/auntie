import { readCmsContent, updateCmsContent } from "@/lib/cms-store"
import {
  expirePaymentOrder,
  isPaymentOrderExpired,
} from "@/lib/payment-order-lifecycle"
import { logServerEvent } from "@/lib/server-log"

const sweepIntervalMs = 5 * 60 * 1000
const globalScheduler = globalThis as typeof globalThis & {
  paymentOrderLifecycleRunning?: boolean
  paymentOrderLifecycleTimer?: ReturnType<typeof setInterval>
}

async function sweepExpiredPaymentOrders() {
  if (globalScheduler.paymentOrderLifecycleRunning) return 0
  globalScheduler.paymentOrderLifecycleRunning = true
  try {
    const content = await readCmsContent()
    const now = new Date()
    const expiredIds = content.paymentOrders
      .filter((order) => isPaymentOrderExpired(order, now.getTime()))
      .map((order) => order.orderId)
    if (!expiredIds.length) return 0
    const idSet = new Set(expiredIds)
    await updateCmsContent((current) => ({
      ...current,
      paymentOrders: current.paymentOrders.map((order) =>
        idSet.has(order.orderId) ? expirePaymentOrder(order, now) : order
      ),
    }))
    logServerEvent("info", "payment_orders.expired_sweep_completed", {
      count: expiredIds.length,
      orderIds: expiredIds,
    })
    return expiredIds.length
  } finally {
    globalScheduler.paymentOrderLifecycleRunning = false
  }
}

async function startPaymentOrderLifecycleScheduler() {
  if (globalScheduler.paymentOrderLifecycleTimer) return
  await sweepExpiredPaymentOrders().catch((error) => {
    logServerEvent("error", "payment_orders.expired_sweep_failed", {
      error: error instanceof Error ? error.message : String(error),
    })
  })
  globalScheduler.paymentOrderLifecycleTimer = setInterval(() => {
    void sweepExpiredPaymentOrders().catch((error) => {
      logServerEvent("error", "payment_orders.expired_sweep_failed", {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, sweepIntervalMs)
  globalScheduler.paymentOrderLifecycleTimer.unref?.()
}

export { startPaymentOrderLifecycleScheduler, sweepExpiredPaymentOrders }
