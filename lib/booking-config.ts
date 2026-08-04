import type {
  CmsBookingCatalogItem,
  CmsBookingLocationConfig,
  CmsOrderAddOnItem,
  CmsPaymentOrder,
  CmsPaymentOrderAmountItem,
  CmsServiceLocation,
} from "@/types/cms"

type BookingEstimateInput = {
  addOnIds: string[]
  bathrooms: number
  bedrooms: number
  config?: CmsBookingLocationConfig
  serviceDurationHours?: number
  serviceTypeId: string
  studio: boolean
}

function getBookingConfigForArea(
  configs: CmsBookingLocationConfig[] | undefined,
  locations: CmsServiceLocation[] | undefined,
  serviceArea: string
) {
  const normalizedArea = serviceArea.trim().toLowerCase()
  const location = (locations ?? []).find((item) => {
    const option = `${item.city} · ${item.country}`.toLowerCase()
    return (
      option === normalizedArea || item.city.toLowerCase() === normalizedArea
    )
  })

  return location
    ? (configs ?? []).find((config) => config.locationId === location.id)
    : undefined
}

function calculateBookingEstimate({
  addOnIds,
  config,
  serviceDurationHours,
  serviceTypeId,
}: BookingEstimateInput) {
  const service = config?.items.find(
    (item) =>
      item.type === "service" && item.id === serviceTypeId && item.enabled
  )

  if (!config || !service || service.quoteRequired) return null

  const addOns = config.items.filter(
    (item) =>
      item.type === "addon" && item.enabled && addOnIds.includes(item.id)
  )
  if (addOns.some((item) => item.quoteRequired)) {
    return null
  }
  const hourlyRate = Number(service.basePrice || 0)
  const duration = Number(serviceDurationHours)
  const normalizedDuration =
    Number.isFinite(duration) && duration > 0 ? duration : 0
  const addOnAmount = addOns.reduce(
    (sum, item) => sum + Number(item.basePrice || 0),
    0
  )
  const amount = normalizedDuration
    ? hourlyRate * normalizedDuration + addOnAmount
    : null

  return {
    addOnAmount: Number(addOnAmount.toFixed(2)),
    amount: amount === null ? null : Number(amount.toFixed(2)),
    currency: config.currency || "USD",
    hourlyRate: Number(hourlyRate.toFixed(2)),
    service,
    serviceDurationHours: normalizedDuration,
  }
}

const serviceAmountLabelPrefix = "服务费用："

function createOrderAddOnSnapshot(
  config: CmsBookingLocationConfig | undefined,
  selectedIds: string[]
): CmsOrderAddOnItem[] {
  return (config?.items ?? [])
    .filter(
      (item) =>
        item.type === "addon" && item.enabled && selectedIds.includes(item.id)
    )
    .map((item) => ({
      id: item.id,
      label: item.label,
      price: Number(item.basePrice || 0),
      quoteRequired: item.quoteRequired === true,
    }))
}

const addOnAmountLabelPrefix = "附加项目："

function createConfiguredOrderAmountBreakdown(
  service: CmsBookingCatalogItem | undefined,
  serviceDurationHours: number | undefined,
  addOns: CmsOrderAddOnItem[] | undefined
) {
  const duration = Number(serviceDurationHours)
  const hourlyRate = Number(service?.basePrice)
  const serviceItems =
    service &&
    !service.quoteRequired &&
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isFinite(hourlyRate) &&
    hourlyRate > 0
      ? [
          {
            amount: Number((duration * hourlyRate).toFixed(2)),
            label: `${serviceAmountLabelPrefix}${service.label}（${formatCompactNumber(duration)}小时 × ${formatCompactNumber(hourlyRate)}/小时）`,
          },
        ]
      : []
  const addOnItems = (addOns ?? [])
    .filter(
      (item) =>
        !item.quoteRequired &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) > 0
    )
    .map((item) => ({
      amount: Number(Number(item.price).toFixed(2)),
      label: `${addOnAmountLabelPrefix}${item.label.trim()}（按次）`,
    }))

  return [...serviceItems, ...addOnItems]
}

function mergeAddOnsIntoAmountBreakdown(
  items: CmsPaymentOrderAmountItem[] | undefined,
  addOns: CmsOrderAddOnItem[] | undefined,
  fallbackBaseAmount = 0
) {
  const manualItems = (items ?? []).filter(
    (item) => !item.label.startsWith(addOnAmountLabelPrefix)
  )
  const normalizedManualItems = manualItems.length
    ? manualItems
    : (items ?? []).length === 0 &&
        Number.isFinite(fallbackBaseAmount) &&
        fallbackBaseAmount > 0
      ? [{ amount: Number(fallbackBaseAmount.toFixed(2)), label: "基础费用" }]
      : []
  const manualLabels = new Set(
    normalizedManualItems.map((item) => item.label.trim())
  )
  const addOnItems = (addOns ?? [])
    .filter(
      (item) =>
        !item.quoteRequired &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) > 0 &&
        !manualLabels.has(item.label.trim())
    )
    .map((item) => ({
      amount: Number(Number(item.price).toFixed(2)),
      label: `${addOnAmountLabelPrefix}${item.label.trim()}（按次）`,
    }))

  return [...normalizedManualItems, ...addOnItems]
}

function formatBookingRequest(order: CmsPaymentOrder) {
  const home = order.studio
    ? `Studio（开间）/ ${formatRoomCount(order.bathrooms)} 卫`
    : `${formatRoomCount(order.bedrooms)} 卧 / ${formatRoomCount(order.bathrooms)} 卫`
  const addOns = [
    ...(order.addOnItems ?? []).map((item) => item.label),
    order.addOnOther?.trim(),
  ].filter(Boolean)

  return [
    "【陈阿姨到家预约需求】",
    `预约编号：${order.orderId || "无"}`,
    `服务地区：${order.serviceArea || "无"}`,
    `清洁类型：${order.serviceType || "无"}`,
    `房屋情况：${home}`,
    `是否有宠物：${order.hasPets ? "是" : "否"}`,
    `期望服务日期：${order.serviceDate || "无"}`,
    `详细地址：${order.serviceAddress || "无"}`,
    `附加项目：${addOns.length ? addOns.join("、") : "无"}`,
    `客户备注：${order.note?.trim() || "无"}`,
    `预估价格: ${formatBookingEstimate(order)}`,
    `联系人：${order.customerName || "无"}`,
    `联系电话：${order.contact || "无"}`,
    "请客服协助确认服务安排。",
  ].join("\n")
}

function formatBookingEstimate(order: CmsPaymentOrder) {
  const duration = Number(order.serviceDurationHours)
  const amount = getBookingOrderAmount(order)
  const durationText =
    Number.isFinite(duration) && duration > 0
      ? `${formatCompactNumber(duration)}小时-`
      : ""

  if (amount <= 0) return `${durationText}待客服确认`

  const currency = String(
    order.amountValue || order.baseAmountValue
      ? order.currency || "USD"
      : order.estimatedCurrency || order.currency || "USD"
  ).toUpperCase()
  const symbol =
    {
      AUD: "A$",
      CAD: "C$",
      EUR: "€",
      GBP: "£",
      HKD: "HK$",
      SGD: "S$",
      USD: "$",
    }[currency] ?? `${currency} `

  return `${durationText}${symbol}${formatCompactNumber(amount)}`
}

function getBookingOrderAmount(order: CmsPaymentOrder) {
  const storedAmount = Number(
    order.amountValue || order.baseAmountValue || order.estimatedAmountValue
  )
  if (Number.isFinite(storedAmount) && storedAmount > 0) return storedAmount

  const parsed = Number(
    order.amount?.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0
  )
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatCompactNumber(value: number) {
  return Number(value.toFixed(2)).toString()
}

function formatRoomCount(value: number | undefined) {
  return Number.isFinite(value) ? String(value) : "0"
}

function isValidBookingPhone(value: string, countryCode?: string) {
  const normalized = value.trim()
  if (!/^[+\d][\d\s().-]{5,24}$/.test(normalized)) return false
  const digits = normalized.replace(/\D/g, "")
  if (digits.length < 7 || digits.length > 15) return false

  const code = countryCode?.trim().toUpperCase()
  if (code === "US" || code === "CA") {
    return (
      digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))
    )
  }
  if (code === "SG") return digits.length === 8 || digits.length === 10
  if (code === "AU") return digits.length >= 9 && digits.length <= 11
  if (code === "GB") return digits.length >= 10 && digits.length <= 12
  if (code === "FR") return digits.length >= 9 && digits.length <= 11

  return true
}

export {
  calculateBookingEstimate,
  createConfiguredOrderAmountBreakdown,
  createOrderAddOnSnapshot,
  formatBookingRequest,
  getBookingConfigForArea,
  isValidBookingPhone,
  mergeAddOnsIntoAmountBreakdown,
}
