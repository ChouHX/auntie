import type { NextRequest } from "next/server"

import { isAdminToken, readCmsContent, updateCmsContent } from "@/lib/cms-store"
import { findSalesMemberForStudentTags } from "@/lib/sales-attribution"
import { calculateOrderFinancialsSafely } from "@/lib/sales-formula"
import {
  listAllWecomCustomersForAnalytics,
  listWecomStudentTags,
} from "@/lib/wecom-store"
import type { CmsSalesMember } from "@/types/cms"

export const runtime = "nodejs"

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return isAdminToken(token ?? null)
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()
  const [content, studentTags] = await Promise.all([
    readCmsContent(),
    listWecomStudentTags(),
  ])
  return Response.json({
    commissionSummaries: createCommissionSummaries(content),
    salesMembers: content.salesMembers,
    studentTags,
  })
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()
  const body = (await request.json().catch(() => ({}))) as {
    salesMembers?: CmsSalesMember[]
  }
  if (!Array.isArray(body.salesMembers)) {
    return Response.json(
      { error: "sales_members_required", message: "销售列表不能为空。" },
      { status: 400 }
    )
  }
  try {
    const ids = new Set<string>()
    const tags = new Set<string>()
    const now = new Date().toISOString()
    const salesMembers = body.salesMembers.map((member) => {
      const id = member.id.trim()
      const name = member.name.trim()
      const studentTag = member.studentTag.trim()
      if (!id || !name || !studentTag)
        throw new Error("销售名称和学员分区标签不能为空。")
      if (ids.has(id)) throw new Error("销售 ID 重复。")
      if (tags.has(studentTag))
        throw new Error("一个学员分区标签只能绑定一位销售。")
      ids.add(id)
      tags.add(studentTag)
      return {
        ...member,
        commissionAdjustment: normalizeSignedAmount(
          member.commissionAdjustment
        ),
        commissionPercentage: clampPercentage(member.commissionPercentage),
        createdAt: member.createdAt || now,
        id,
        name,
        status:
          member.status === "inactive"
            ? ("inactive" as const)
            : ("active" as const),
        studentTag,
        updatedAt: now,
      }
    })
    const customers = await listAllWecomCustomersForAnalytics()
    const customerMap = new Map(
      customers.map((customer) => [customer.relationId, customer])
    )
    const savedContent = await updateCmsContent((content) => {
      const nextContent = { ...content, salesMembers }
      return {
        ...nextContent,
        paymentOrders: content.paymentOrders.map((order) => {
          const customer = order.customerRelationId
            ? customerMap.get(order.customerRelationId)
            : undefined
          const salesMember = findSalesMemberForStudentTags(
            customer?.studentType,
            salesMembers
          )
          const attributedOrder = salesMember
            ? {
                ...order,
                salesMemberId: salesMember.id,
                salesOwner: salesMember.name,
                salesOwnerSource: "wecom_tag" as const,
              }
            : order.salesOwnerSource === "wecom_member" ||
                order.salesOwnerSource === "wecom_tag"
              ? {
                  ...order,
                  salesMemberId: undefined,
                  salesOwner: "",
                  salesOwnerSource: undefined,
                }
              : order
          return attributedOrder.status === "paid"
            ? calculateOrderFinancialsSafely(attributedOrder, nextContent)
            : attributedOrder
        }),
      }
    })
    return Response.json({
      commissionSummaries: createCommissionSummaries(savedContent),
      salesMembers,
      studentTags: await listWecomStudentTags(),
    })
  } catch (error) {
    return Response.json(
      {
        error: "sales_members_invalid",
        message: error instanceof Error ? error.message : "销售资料保存失败。",
      },
      { status: 400 }
    )
  }
}

function createCommissionSummaries(
  content: Awaited<ReturnType<typeof readCmsContent>>
) {
  return content.salesMembers.map((member) => {
    const currencyTotals = new Map<string, number>()
    let cnyAmount = 0
    let missingCnyCount = 0

    content.paymentOrders.forEach((order) => {
      if (
        order.status !== "paid" ||
        (order.salesMemberId !== member.id && order.salesOwner !== member.name)
      ) {
        return
      }
      const commission = normalizeSignedAmount(order.salesCommission)
      const currency = String(order.currency || "USD").toUpperCase()
      currencyTotals.set(
        currency,
        (currencyTotals.get(currency) ?? 0) + commission
      )
      const rate =
        currency === "CNY" ? 1 : Number(order.profitExchangeRateToCny)
      if (Number.isFinite(rate) && rate > 0) {
        cnyAmount += commission * rate
      } else if (commission !== 0) {
        missingCnyCount += 1
      }
    })

    return {
      cnyAmount: roundMoney(cnyAmount),
      currencies: Array.from(currencyTotals, ([currency, amount]) => ({
        amount: roundMoney(amount),
        currency,
      })).sort((left, right) => left.currency.localeCompare(right.currency)),
      missingCnyCount,
      salesMemberId: member.id,
    }
  })
}

function clampPercentage(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0
}

function normalizeSignedAmount(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function unauthorized() {
  return Response.json(
    { error: "unauthorized", message: "Admin authentication is required." },
    { status: 401 }
  )
}
