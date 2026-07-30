import { randomUUID } from "node:crypto"

import type { NextRequest } from "next/server"

import { updateCmsContent } from "@/lib/cms-store"
import { logServerEvent, serializeServerError } from "@/lib/server-log"
import type { CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

type BookingOrderBody = {
  bathrooms?: string
  bedrooms?: string
  contact?: string
  customerName?: string
  note?: string
  serviceAddress?: string
  serviceArea?: string
  serviceDate?: string
  serviceType?: string
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
  const orderDraft: Omit<CmsPaymentOrder, "orderId"> = {
    amount: "",
    contact: normalizeText(body.contact),
    createdAt: now,
    customerName: normalizeText(body.customerName) || "自主预约客户",
    note: createOrderNote(body),
    serviceAddress: normalizeText(body.serviceAddress),
    serviceArea: normalizeText(body.serviceArea),
    serviceDate: normalizeText(body.serviceDate) || "待确认",
    serviceType: normalizeText(body.serviceType),
    status: "awaiting_confirmation",
    updatedAt: now,
  }

  if (
    !orderDraft.contact ||
    !orderDraft.serviceAddress ||
    !orderDraft.serviceArea ||
    !orderDraft.serviceType
  ) {
    return bookingJsonResponse(
      {
        error: "booking_order_invalid",
        message:
          "Please provide contact, service area, address, and service type.",
        requestId,
      },
      400,
      requestId
    )
  }

  try {
    let savedOrder: CmsPaymentOrder | null = null
    await updateCmsContent((content) => {
      const order: CmsPaymentOrder = {
        ...orderDraft,
        orderId: createPaymentOrderId(content.paymentOrders ?? []),
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

function createOrderNote(body: BookingOrderBody) {
  const rows = [
    ["预约来源", "网站自主预约"],
    ["卧室数量", body.bedrooms],
    ["卫生间数量", body.bathrooms],
    ["备注", body.note],
  ]
    .map(([label, value]) => [label, normalizeText(value)] as const)
    .filter(([, value]) => value)

  return rows.map(([label, value]) => `${label}: ${value}`).join("\n")
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
