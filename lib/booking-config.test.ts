import assert from "node:assert/strict"
import test from "node:test"
import type { CmsBookingLocationConfig } from "@/types/cms"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const booking = await import("./booking-config.ts")
const {
  calculateBookingEstimate,
  createConfiguredOrderAmountBreakdown,
  formatBookingRequest,
  getBookingConfigForArea,
  isValidBookingPhone,
  mergeAddOnsIntoAmountBreakdown,
} = booking

const config: CmsBookingLocationConfig = {
  currency: "USD",
  locationId: "los-angeles",
  items: [
    {
      basePrice: 100,
      bathroomPrices: [{ amount: 20, quantity: 1 }],
      bedroomPrices: [{ amount: 30, quantity: 1 }],
      description: "Test cleaning",
      enabled: true,
      id: "regular",
      label: "日常清洁",
      studioPrice: 15,
      type: "service",
    },
    {
      basePrice: 25,
      description: "Test add-on",
      enabled: true,
      id: "oven",
      label: "烤箱内部清洁",
      type: "addon",
    },
  ],
}

test("matches booking configuration by the selected service area", () => {
  const result = getBookingConfigForArea(
    [config],
    [
      {
        city: "洛杉矶",
        country: "美国",
        id: "los-angeles",
        label: "Los Angeles",
        latitude: 0,
        longitude: 0,
      },
    ],
    "洛杉矶 · 美国"
  )

  assert.equal(result?.locationId, "los-angeles")
})

test("uses hourly service pricing and per-use add-ons", () => {
  const result = calculateBookingEstimate({
    addOnIds: ["oven"],
    bathrooms: 1,
    bedrooms: 0,
    config,
    serviceDurationHours: 2,
    serviceTypeId: "regular",
    studio: true,
  })

  assert.equal(result?.amount, 225)
  assert.equal(result?.hourlyRate, 100)
  assert.equal(result?.addOnAmount, 25)
  assert.equal(result?.currency, "USD")
})

test("formats the copied request with duration and estimated pricing", () => {
  const text = formatBookingRequest({
    addOnItems: [{ id: "oven", label: "烤箱内部清洁", price: 25 }],
    amount: "",
    bathrooms: 1,
    bedrooms: 0,
    contact: "+1 213 555 0123",
    createdAt: "2026-08-03T00:00:00.000Z",
    customerName: "陈女士",
    estimatedAmountValue: 438,
    estimatedCurrency: "USD",
    hasPets: true,
    note: "请提前联系",
    orderId: "ORD20260803TEST",
    serviceAddress: "123 Main St",
    serviceArea: "洛杉矶 · 美国",
    serviceDate: "2026-08-10",
    serviceDurationHours: 4,
    serviceType: "日常清洁",
    status: "awaiting_confirmation",
    studio: true,
    updatedAt: "2026-08-03T00:00:00.000Z",
  })

  assert.match(text, /房屋情况：Studio（开间）\/ 1 卫/)
  assert.match(text, /附加项目：烤箱内部清洁/)
  assert.match(text, /预估价格: 4小时-\$438/)
})

test("validates local phone number length for configured countries", () => {
  assert.equal(isValidBookingPhone("+1 213 555 0123", "US"), true)
  assert.equal(isValidBookingPhone("wechat-name", "US"), false)
  assert.equal(isValidBookingPhone("12345", "US"), false)
  assert.equal(isValidBookingPhone("9123 4567", "SG"), true)
})

test("adds fixed-price add-ons to the payment breakdown without duplicates", () => {
  const breakdown = mergeAddOnsIntoAmountBreakdown(
    [{ amount: 100, label: "基础清洁" }],
    [
      { id: "oven", label: "烤箱内部清洁", price: 25 },
      { id: "other", label: "其他", price: 50, quoteRequired: true },
    ]
  )

  assert.deepEqual(breakdown, [
    { amount: 100, label: "基础清洁" },
    { amount: 25, label: "附加项目：烤箱内部清洁（按次）" },
  ])
  assert.deepEqual(
    mergeAddOnsIntoAmountBreakdown(breakdown, [
      { id: "oven", label: "烤箱内部清洁", price: 25 },
    ]),
    breakdown
  )
})

test("creates order amount lines from hourly service and per-use add-ons", () => {
  assert.deepEqual(
    createConfiguredOrderAmountBreakdown(config.items[0], 4, [
      { id: "oven", label: "烤箱内部清洁", price: 25 },
    ]),
    [
      {
        amount: 400,
        label: "服务费用：日常清洁（4小时 × 100/小时）",
      },
      {
        amount: 25,
        label: "附加项目：烤箱内部清洁（按次）",
      },
    ]
  )
})

test("does not duplicate an add-on-only configured breakdown", () => {
  assert.deepEqual(
    mergeAddOnsIntoAmountBreakdown(
      [{ amount: 25, label: "附加项目：烤箱内部清洁（按次）" }],
      [{ id: "oven", label: "烤箱内部清洁", price: 25 }],
      25
    ),
    [{ amount: 25, label: "附加项目：烤箱内部清洁（按次）" }]
  )
})

test("preserves a legacy base amount when adding add-ons", () => {
  assert.deepEqual(
    mergeAddOnsIntoAmountBreakdown(
      [],
      [{ id: "oven", label: "烤箱内部清洁", price: 25 }],
      100
    ),
    [
      { amount: 100, label: "基础费用" },
      { amount: 25, label: "附加项目：烤箱内部清洁（按次）" },
    ]
  )
})
