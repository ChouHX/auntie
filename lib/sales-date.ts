export function shanghaiDate(date: Date) {
  if (!Number.isFinite(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(date)
}

export function validMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

// Build the range before applying month, search, or pagination filters.
export function orderMonthOptions(
  orders: ReadonlyArray<{ serviceDate?: string }>,
  now = new Date()
) {
  const current = shanghaiDate(now).slice(0, 7)
  let earliest = current
  let latest = current
  for (const order of orders) {
    const month = serviceMonth(order.serviceDate)
    if (!validMonth(month)) continue
    if (month < earliest) earliest = month
    if (month > latest) latest = month
  }
  const index = (month: string) =>
    Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 1
  const months: string[] = []
  for (let value = index(latest); value >= index(earliest); value--) {
    months.push(
      `${String(Math.floor(value / 12)).padStart(4, "0")}-${String((value % 12) + 1).padStart(2, "0")}`
    )
  }
  return months
}

// Service dates are calendar dates in the service location, not timestamps.
export function serviceMonth(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ""
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value.slice(0, 7)
    : ""
}
