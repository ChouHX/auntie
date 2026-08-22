import { NextRequest } from "next/server"

import { createPaymentProof } from "@/lib/payment-proof"
import {
  findPaymentOrder,
  normalizePaymentOrderId,
  readCmsContent,
  updateCmsContent,
} from "@/lib/cms-store"
import { parsePaymentAmountValue } from "@/lib/airwallex"
import { ZELLE_PROOF_PENDING } from "@/lib/zelle-payment-status"
import type { CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const normalizedOrderId = normalizePaymentOrderId(orderId)
  const content = await readCmsContent()
  const existing = findPaymentOrder(content, normalizedOrderId)

  if (!existing) {
    return Response.json(
      { error: "order_not_found", message: "Payment order was not found." },
      { status: 404 }
    )
  }
  if (existing.status === "cancelled" || existing.status === "failed") {
    return Response.json(
      { error: "order_not_payable", message: "该订单当前不能上传付款凭证。" },
      { status: 409 }
    )
  }
  if (existing.status === "paid") {
    return Response.json(
      { error: "order_already_paid", message: "该订单已完成付款。" },
      { status: 409 }
    )
  }

  let file: FormDataEntryValue | null
  let tipAmount: number | null
  try {
    const formData = await request.formData()
    file = formData.get("file")
    tipAmount = parseTipAmount(formData.get("tipAmount"))
  } catch {
    return Response.json(
      { error: "invalid_form_data", message: "付款凭证上传数据无效。" },
      { status: 400 }
    )
  }

  if (tipAmount === null) {
    return Response.json(
      {
        error: "invalid_tip_amount",
        message: "小费金额必须在 0 到 1000 之间。",
      },
      { status: 400 }
    )
  }

  // Avoid instanceof File here: dev runtimes can provide a File from a
  // different realm even though it is a valid multipart upload.
  if (
    !file ||
    typeof file === "string" ||
    typeof file.arrayBuffer !== "function" ||
    typeof file.type !== "string"
  ) {
    return Response.json(
      { error: "missing_file", message: "付款凭证图片不能为空。" },
      { status: 400 }
    )
  }

  try {
    const proof = await createPaymentProof(file as File)
    let savedOrder = existing
    await updateCmsContent((current) => {
      const currentOrder = findPaymentOrder(current, normalizedOrderId)
      if (!currentOrder) return current
      const baseAmountValue = getBaseAmountValue(currentOrder)
      const amountValue = Number((baseAmountValue + tipAmount!).toFixed(2))
      savedOrder = {
        ...currentOrder,
        airwallexPaymentIntentClientSecret: undefined,
        airwallexPaymentIntentId: undefined,
        airwallexPaymentLinkId: undefined,
        airwallexPaymentUrl: undefined,
        amount: formatPaymentAmount(amountValue, currentOrder.amount),
        amountValue,
        baseAmountValue,
        dealStatus: "unconverted",
        failureReason: undefined,
        gatewayStatus: ZELLE_PROOF_PENDING,
        paidAt: undefined,
        paymentExpiresAt: undefined,
        provider: "offline",
        receivedAmount: 0,
        status: "pending",
        tipAmount: tipAmount!,
        zellePaymentProof: proof,
        updatedAt: new Date().toISOString(),
      }
      return {
        ...current,
        paymentOrders: current.paymentOrders.map((item) =>
          normalizePaymentOrderId(item.orderId) === normalizedOrderId
            ? savedOrder
            : item
        ),
      }
    })
    const publicOrder = { ...savedOrder }
    delete publicOrder.airwallexPaymentIntentClientSecret
    return Response.json({ order: publicOrder })
  } catch (error) {
    return Response.json(
      {
        error: "payment_proof_invalid",
        message: error instanceof Error ? error.message : "付款凭证上传失败。",
      },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params
  const normalizedOrderId = normalizePaymentOrderId(orderId)
  let savedOrder: CmsPaymentOrder | null = null
  let isPaidOrder = false
  await updateCmsContent((current) => {
    const currentOrder = findPaymentOrder(current, normalizedOrderId)
    if (!currentOrder) return current
    if (currentOrder.status === "paid") {
      isPaidOrder = true
      return current
    }
    savedOrder = {
      ...currentOrder,
      gatewayStatus: "",
      provider: "airwallex",
      status: "unpaid",
      zellePaymentProof: undefined,
      updatedAt: new Date().toISOString(),
    }
    return {
      ...current,
      paymentOrders: current.paymentOrders.map((item) =>
        normalizePaymentOrderId(item.orderId) === normalizedOrderId
          ? savedOrder!
          : item
      ),
    }
  })
  if (isPaidOrder) {
    return Response.json(
      {
        error: "order_already_paid",
        message: "已确认付款的订单不能删除用户凭证。",
      },
      { status: 409 }
    )
  }
  if (!savedOrder)
    return Response.json({ error: "order_not_found" }, { status: 404 })
  const orderToReturn = savedOrder as CmsPaymentOrder
  const publicOrder = { ...orderToReturn }
  delete publicOrder.airwallexPaymentIntentClientSecret
  return Response.json({ order: publicOrder })
}

function parseTipAmount(value: FormDataEntryValue | null) {
  const amount = Number(value ?? 0)

  if (!Number.isFinite(amount) || amount < 0 || amount > 1000) {
    return null
  }

  return Number(amount.toFixed(2))
}

function getBaseAmountValue(order: CmsPaymentOrder) {
  const baseAmount = Number(order.baseAmountValue)

  if (Number.isFinite(baseAmount) && baseAmount >= 0) {
    return baseAmount
  }

  const amountValue = parsePaymentAmountValue(order.amountValue, order.amount)
  const tipAmount = Number(order.tipAmount)

  return Number(
    Math.max(
      0,
      amountValue - (Number.isFinite(tipAmount) ? tipAmount : 0)
    ).toFixed(2)
  )
}

function formatPaymentAmount(value: number, previousAmount: string) {
  const prefix = previousAmount.trim().match(/[^\d.,\s-]+/)?.[0] ?? "$"
  return `${prefix}${value.toFixed(2)}`
}
