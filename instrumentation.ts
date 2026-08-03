export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { rescheduleWecomCustomerSync } =
      await import("@/lib/wecom-scheduler")
    const { startPaymentOrderLifecycleScheduler } =
      await import("@/lib/order-lifecycle-scheduler")
    await Promise.all([
      rescheduleWecomCustomerSync(),
      startPaymentOrderLifecycleScheduler(),
    ])
  }
}
