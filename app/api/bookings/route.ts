import type { NextRequest } from "next/server"

import {
  isAuntieServingArea,
  pickAutoAssignedAuntie,
  type AuntieAssignmentMode,
} from "@/lib/auntie-assignment"
import {
  normalizePaymentCurrency,
  parsePaymentAmountValue,
} from "@/lib/airwallex"
import { updateCmsContent } from "@/lib/cms-store"
import type { CmsContent, CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

type BookingOrderBody = {
  amount?: string
  assignedAuntieId?: string
  assignmentMode?: AuntieAssignmentMode
  bathrooms?: string
  bedrooms?: string
  contact?: string
  customerName?: string
  note?: string
  priceEstimate?: string
  serviceAddress?: string
  serviceArea?: string
  serviceDate?: string
  serviceType?: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as BookingOrderBody
  const now = new Date().toISOString()
  const orderDraft: Omit<CmsPaymentOrder, "orderId"> = {
    amount: normalizeAmount(body.amount),
    contact: normalizeText(body.contact),
    createdAt: now,
    customerName: normalizeText(body.customerName) || "自主预约客户",
    note: createOrderNote(body),
    serviceAddress: normalizeText(body.serviceAddress),
    serviceArea: normalizeText(body.serviceArea),
    serviceDate: normalizeText(body.serviceDate) || "待确认",
    serviceType: normalizeText(body.serviceType),
    status: "unpaid",
    updatedAt: now,
  }

  if (
    !orderDraft.contact ||
    !orderDraft.serviceAddress ||
    !orderDraft.serviceArea ||
    !orderDraft.serviceType ||
    !orderDraft.amount
  ) {
    return Response.json(
      {
        error: "booking_order_invalid",
        message:
          "Please provide contact, service area, address, service type, and amount.",
      },
      { status: 400 }
    )
  }

  let savedOrder: CmsPaymentOrder | null = null
  let assignmentError = ""
  await updateCmsContent((content) => {
    const amountValue = parsePaymentAmountValue(undefined, orderDraft.amount)
    const currency = normalizePaymentCurrency(content.paymentSettings.currency)
    const assignedAuntieId = resolveAssignedAuntieId(
      body,
      orderDraft.serviceArea,
      content
    )

    if (assignedAuntieId.error) {
      assignmentError = assignedAuntieId.error
      return content
    }

    const order: CmsPaymentOrder = {
      ...orderDraft,
      amountValue,
      currency,
      ...(assignedAuntieId.value
        ? { assignedAuntieId: assignedAuntieId.value }
        : null),
      orderId: createPaymentOrderId(content.paymentOrders ?? []),
      provider: "airwallex",
    }
    savedOrder = order

    return {
      ...content,
      paymentOrders: [order, ...(content.paymentOrders ?? [])],
    }
  })

  if (!savedOrder) {
    if (assignmentError) {
      return Response.json(
        {
          error: "booking_auntie_invalid",
          message: assignmentError,
        },
        { status: 400 }
      )
    }

    return Response.json(
      {
        error: "booking_order_failed",
        message: "Payment order could not be created.",
      },
      { status: 500 }
    )
  }

  const order = savedOrder as CmsPaymentOrder

  return Response.json(
    {
      order,
      paymentPath: `/checkout?order=${encodeURIComponent(order.orderId)}`,
    },
    { status: 201 }
  )
}

function resolveAssignedAuntieId(
  body: BookingOrderBody,
  serviceArea: string,
  content: CmsContent
) {
  const mode = body.assignmentMode === "manual" ? "manual" : "auto"

  if (mode === "auto") {
    return {
      value: pickAutoAssignedAuntie(
        serviceArea,
        content.teamMembers ?? [],
        content.paymentOrders ?? []
      )?.id,
    }
  }

  const requestedAuntieId = normalizeText(body.assignedAuntieId)

  if (!requestedAuntieId) {
    return { value: undefined }
  }

  const auntie = (content.teamMembers ?? []).find(
    (member) => member.id === requestedAuntieId
  )

  if (!auntie) {
    return { error: "Selected auntie was not found." }
  }

  if (auntie.status !== "available") {
    return { error: "Selected auntie is not currently available." }
  }

  if (!isAuntieServingArea(auntie, serviceArea)) {
    return { error: "Selected auntie does not serve this area." }
  }

  return { value: auntie.id }
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim()
}

function normalizeAmount(value: unknown) {
  const raw = normalizeText(value)

  return raw || "$0.00"
}

function createOrderNote(body: BookingOrderBody) {
  const rows = [
    ["卧室数量", body.bedrooms],
    ["卫生间数量", body.bathrooms],
    ["预估价格", body.priceEstimate],
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
