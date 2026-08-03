import { randomUUID } from "node:crypto"

import type { NextRequest } from "next/server"

import { readCmsContent, updateCmsContent } from "@/lib/cms-store"
import {
  createOrderAddOnSnapshot,
  getBookingConfigForArea,
  isValidBookingPhone,
} from "@/lib/booking-config"
import { logServerEvent, serializeServerError } from "@/lib/server-log"
import type { CmsPaymentOrder, CmsServiceLocation, CmsServiceRegion } from "@/types/cms"

export const runtime = "nodejs"

type BookingOrderBody = {
  addOnIds?: string[]
  addOnOther?: string
  bathrooms?: string
  bedrooms?: string
  contact?: string
  customerName?: string
  hasPets?: boolean
  note?: string
  serviceAddress?: string
  serviceArea?: string
  serviceDate?: string
  serviceType?: string
  serviceTypeId?: string
  studio?: boolean
  timezoneOffsetMinutes?: number
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  const startedAt = Date.now()
  let body: BookingOrderBody

  logServerEvent("info", "booking.order.received", { requestId })

  try {
    body = (await request.json()) as BookingOrderBody
  } catch (error) {
    logServerEvent("warn", "booking.order.invalid_json", {
      error: serializeServerError(error),
      requestId,
    })
    return bookingJsonResponse(
      {
        error: "booking_order_invalid_json",
        message: "Invalid JSON.",
        requestId,
      },
      400,
      requestId
    )
  }
  const now = new Date().toISOString()
  const serviceDate = normalizeText(body.serviceDate)
  const serviceArea = normalizeText(body.serviceArea)
  const contact = normalizeText(body.contact)
  const studio = body.studio === true
  const bedrooms = studio ? 0 : normalizeRoomCount(body.bedrooms)
  const bathrooms = normalizeRoomCount(body.bathrooms)
  const minimumServiceDate = getLocalDateKey(body.timezoneOffsetMinutes)

  if (
    !contact ||
    !normalizeText(body.customerName) ||
    !normalizeText(body.serviceAddress) ||
    !serviceArea ||
    !normalizeText(body.serviceTypeId || body.serviceType) ||
    (!studio && bedrooms < 1) ||
    bathrooms < 1 ||
    !isValidDateKey(serviceDate) ||
    serviceDate < minimumServiceDate
  ) {
    return bookingJsonResponse(
      {
        error: "booking_order_invalid",
        message:
          "Please provide all required booking details and select today or a future service date.",
        requestId,
      },
      400,
      requestId
    )
  }

  try {
    const bookingContent = await readCmsContent()
    const config = getBookingConfigForArea(
      bookingContent.bookingConfigs,
      bookingContent.serviceLocations,
      serviceArea
    )
    const service = config?.items.find(
      (item) =>
        item.type === "service" &&
        item.enabled &&
        (item.id === normalizeText(body.serviceTypeId) ||
          item.label === normalizeText(body.serviceType))
    )
    const phoneIsValid = isValidBookingPhone(
      contact,
      getServiceAreaCountryCode(
        bookingContent.serviceLocations,
        bookingContent.serviceRegions,
        serviceArea
      )
    )

    if (!phoneIsValid || !service) {
      return bookingJsonResponse(
        {
          error: "booking_order_invalid",
          message: !phoneIsValid
            ? "A valid local phone number is required."
            : "Selected cleaning service is unavailable.",
          requestId,
        },
        400,
        requestId
      )
    }

    let savedOrder: CmsPaymentOrder | null = null
    await updateCmsContent((content) => {
      const order: CmsPaymentOrder = {
        addOnItems: createOrderAddOnSnapshot(
          config,
          Array.isArray(body.addOnIds) ? body.addOnIds : []
        ),
        addOnOther: normalizeText(body.addOnOther),
        amount: "",
        bathrooms,
        bedrooms,
        contact,
        createdAt: now,
        customerName: normalizeText(body.customerName),
        hasPets: body.hasPets === true,
        note: normalizeText(body.note),
        orderId: createPaymentOrderId(content.paymentOrders ?? []),
        serviceAddress: normalizeText(body.serviceAddress),
        serviceArea,
        serviceDate,
        serviceType: service.label,
        serviceTypeId: service.id,
        status: "awaiting_confirmation",
        studio,
        updatedAt: now,
      }
      savedOrder = order

      return {
        ...content,
        paymentOrders: [order, ...(content.paymentOrders ?? [])],
      }
    })

    if (!savedOrder) {
      return bookingJsonResponse(
        {
          error: "booking_order_failed",
          message: "Payment order could not be created.",
        },
        500,
        requestId
      )
    }

    const order = savedOrder as CmsPaymentOrder

    logServerEvent("info", "booking.order.created", {
      durationMs: Date.now() - startedAt,
      orderId: order.orderId,
      requestId,
    })

    return bookingJsonResponse({ order }, 201, requestId)
  } catch (error) {
    logServerEvent("error", "booking.order.create_failed", {
      durationMs: Date.now() - startedAt,
      error: serializeServerError(error),
      requestId,
    })
    return bookingJsonResponse(
      {
        error: "booking_order_failed",
        message: "Payment order could not be created.",
        requestId,
      },
      500,
      requestId
    )
  }
}

function getRequestId(request: NextRequest) {
  const value = request.headers.get("x-request-id")?.trim() ?? ""
  return /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : randomUUID()
}

function bookingJsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string
) {
  return Response.json(body, { headers: { "x-request-id": requestId }, status })
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim()
}

function getLocalDateKey(timezoneOffsetMinutes: unknown) {
  const offset = Number(timezoneOffsetMinutes)
  const safeOffset =
    Number.isFinite(offset) && Math.abs(offset) <= 14 * 60 ? offset : 0
  return new Date(Date.now() - safeOffset * 60_000).toISOString().slice(0, 10)
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

function normalizeRoomCount(value: unknown) {
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? count : 0
}

function getServiceAreaCountryCode(
  locations: CmsServiceLocation[],
  regions: CmsServiceRegion[],
  serviceArea: string
) {
  const location = locations.find(
    (item) => `${item.city} · ${item.country}` === serviceArea
  )
  return regions.find((item) => item.name === location?.country)?.code2
}

function createPaymentOrderId(existingOrders: CmsPaymentOrder[]) {
  const date = new Date()
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("")
  const existingIds = new Set(
    existingOrders.map((order) => normalizeOrderId(order.orderId))
  )

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
    const orderId = `ORD${datePart}${randomPart}`

    if (!existingIds.has(normalizeOrderId(orderId))) {
      return orderId
    }
  }

  return `ORD${datePart}${Date.now().toString(36).slice(-6).toUpperCase()}`
}

function normalizeOrderId(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}
