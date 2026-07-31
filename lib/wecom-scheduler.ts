import {
  getNextRunAt,
  getNextIntervalRunAt,
  getWecomSyncSettings,
  syncWecomCustomers,
  updateWecomNextRunAt,
} from "@/lib/wecom-store"
import { logServerEvent } from "@/lib/server-log"

const globalScheduler = globalThis as typeof globalThis & {
  wecomCustomerTimer?: ReturnType<typeof setTimeout>
}

export async function rescheduleWecomCustomerSync() {
  if (globalScheduler.wecomCustomerTimer) {
    clearTimeout(globalScheduler.wecomCustomerTimer)
    globalScheduler.wecomCustomerTimer = undefined
  }

  const settings = await getWecomSyncSettings()
  if (!settings.enabled) return settings

  const nextRunAt =
    settings.mode === "interval"
      ? getNextIntervalRunAt(settings.intervalMinutes)
      : getNextRunAt(settings.hour, settings.minute)
  await updateWecomNextRunAt(nextRunAt)
  const delay = Math.max(1_000, new Date(nextRunAt).getTime() - Date.now())
  globalScheduler.wecomCustomerTimer = setTimeout(async () => {
    try {
      await syncWecomCustomers()
    } catch {
      // The sync service records the complete error for the admin page and logs.
    } finally {
      await rescheduleWecomCustomerSync().catch((error) => {
        logServerEvent("error", "wecom.customers.schedule_failed", {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
  }, delay)

  globalScheduler.wecomCustomerTimer.unref?.()
  logServerEvent("info", "wecom.customers.schedule_ready", {
    intervalMinutes:
      settings.mode === "interval" ? settings.intervalMinutes : undefined,
    mode: settings.mode,
    nextRunAt,
  })
  return { ...settings, nextRunAt }
}
