import type { NextRequest } from "next/server"

import { isAdminToken, readCmsContent, updateCmsContent } from "@/lib/cms-store"
import {
  calculateOrderFinancials,
  validateFormulaTemplateSet,
} from "@/lib/sales-formula"
import { createSalesDashboardResult } from "@/lib/sales-dashboard"
import { persistOrderProfitCnyIfNeeded } from "@/lib/order-profit-exchange-store"
import { captureOrderSalesCommission } from "@/lib/sales-commission"
import type {
  SalesDashboardQuery,
  SalesOrderFinancePatch,
} from "@/lib/sales-dashboard-types"
import { listAllWecomCustomersForAnalytics } from "@/lib/wecom-store"
import type { CmsFormulaTemplate, CmsPaymentOrder } from "@/types/cms"

export const runtime = "nodejs"

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return isAdminToken(token ?? null)
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()
  const body = (await request
    .json()
    .catch(() => ({}))) as Partial<SalesDashboardQuery>
  const query: SalesDashboardQuery = {
    filters: Array.isArray(body.filters) ? body.filters.slice(0, 20) : [],
    logic: body.logic === "any" ? "any" : "all",
    ordersOnly: body.ordersOnly !== false,
    page: Number(body.page) || 1,
    pageSize: Number(body.pageSize) || 20,
  }
  const [content, customers] = await Promise.all([
    readCmsContent(),
    listAllWecomCustomersForAnalytics(),
  ])
  return Response.json(createSalesDashboardResult(content, customers, query))
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()
  const patch = (await request
    .json()
    .catch(() => ({}))) as SalesOrderFinancePatch
  if (!patch.orderId?.trim()) {
    return Response.json(
      { error: "order_id_required", message: "订单号不能为空。" },
      { status: 400 }
    )
  }
  try {
    let savedOrder = null
    await updateCmsContent((content) => {
      const current = content.paymentOrders.find(
        (order) => order.orderId === patch.orderId
      )
      if (!current) throw new Error("订单不存在。")
      const paymentAmount = normalizeAmount(
        patch.paymentAmount ?? patch.receivedAmount,
        current.amountValue || current.receivedAmount
      )
      const storedBreakdown = current.amountBreakdown ?? []
      const storedBreakdownTotal = storedBreakdown.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      )
      const amountBreakdown =
        storedBreakdown.length &&
        Math.abs(storedBreakdownTotal - paymentAmount) < 0.01
          ? storedBreakdown
          : paymentAmount > 0
            ? [{ amount: paymentAmount, label: "订单金额" }]
            : []
      if (patch.markAsOfflinePaid && paymentAmount <= 0) {
        throw new Error("确认公司账户收款前，请填写大于 0 的订单金额。")
      }
      const offlinePaid = patch.markAsOfflinePaid === true
      const shouldUpdateSalesMember = patch.salesMemberId !== undefined
      const selectedSalesMember =
        shouldUpdateSalesMember && patch.salesMemberId
          ? content.salesMembers.find(
              (member) => member.id === patch.salesMemberId
            )
          : null
      const orderForCalculation: CmsPaymentOrder = {
        ...current,
        amount: formatOrderAmount(paymentAmount, current.currency || "USD"),
        amountBreakdown,
        amountValue: paymentAmount,
        baseAmountValue: Math.max(
          0,
          paymentAmount - Number(current.tipAmount || 0)
        ),
        customerRelationId:
          patch.customerRelationId ?? current.customerRelationId,
        customerType: patch.customerType ?? current.customerType,
        dealStatus:
          offlinePaid || current.status === "paid"
            ? "converted"
            : "unconverted",
        financeNote: patch.financeNote ?? current.financeNote,
        formulaTemplateIds: {
          ...current.formulaTemplateIds,
          ...patch.formulaTemplateIds,
        },
        otherCost: normalizeAmount(patch.otherCost, current.otherCost),
        gatewayStatus: offlinePaid ? "OFFLINE_PAID" : current.gatewayStatus,
        paidAt: offlinePaid
          ? current.paidAt || new Date().toISOString()
          : current.paidAt,
        provider: offlinePaid ? "offline" : current.provider,
        receivedAmount: paymentAmount,
        salesMemberId: shouldUpdateSalesMember
          ? (selectedSalesMember?.id ?? "")
          : current.salesMemberId,
        salesOwner: shouldUpdateSalesMember
          ? (selectedSalesMember?.name ?? "")
          : current.salesOwner,
        salesOwnerSource: shouldUpdateSalesMember
          ? selectedSalesMember
            ? "manual"
            : undefined
          : current.salesOwnerSource,
        salesCommissionSnapshot:
          shouldUpdateSalesMember &&
          selectedSalesMember?.id !== current.salesMemberId
            ? undefined
            : current.salesCommissionSnapshot,
        status: offlinePaid ? "paid" : current.status,
        updatedAt: new Date().toISOString(),
      }
      const next = calculateOrderFinancials(
        captureOrderSalesCommission(orderForCalculation, content.salesMembers),
        content
      )
      savedOrder = next
      return {
        ...content,
        paymentOrders: content.paymentOrders.map((order) =>
          order.orderId === next.orderId ? next : order
        ),
      }
    })
    if (savedOrder) {
      savedOrder = await persistOrderProfitCnyIfNeeded(savedOrder)
    }
    return Response.json({ order: savedOrder })
  } catch (error) {
    return Response.json(
      {
        error: "sales_order_update_failed",
        message: error instanceof Error ? error.message : "经营数据保存失败。",
      },
      { status: 400 }
    )
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return unauthorized()
  const body = (await request.json().catch(() => ({}))) as {
    templates?: CmsFormulaTemplate[]
  }
  if (!Array.isArray(body.templates) || body.templates.length !== 1) {
    return Response.json(
      {
        error: "single_formula_template_required",
        message: "公司利润必须且只能保留一条全局规则。",
      },
      { status: 400 }
    )
  }
  const templates = body.templates
  try {
    templates.forEach((template) => {
      if (!template.id?.trim()) throw new Error("公司利润规则 ID 不能为空。")
      if (template.target !== "orderProfit")
        throw new Error("全局计算规则只能维护公司利润公式。")
    })
    validateFormulaTemplateSet(templates)
    let savedTemplates: CmsFormulaTemplate[] = []
    await updateCmsContent((content) => {
      const now = new Date().toISOString()
      savedTemplates = templates.map((template) => {
        const existing = content.formulaTemplates.find(
          (item) => item.id === template.id
        )
        const changed =
          !existing ||
          JSON.stringify({
            ...existing,
            createdAt: "",
            updatedAt: "",
            version: 0,
          }) !==
            JSON.stringify({
              ...template,
              createdAt: "",
              updatedAt: "",
              version: 0,
            })
        return {
          ...template,
          createdAt: existing?.createdAt || now,
          name: "公司利润",
          updatedAt: changed ? now : existing?.updatedAt || now,
          version: existing ? existing.version + (changed ? 1 : 0) : 1,
        }
      })
      const nextContent = { ...content, formulaTemplates: savedTemplates }
      return {
        ...nextContent,
        paymentOrders: content.paymentOrders.map((order) =>
          order.status === "paid"
            ? calculateOrderFinancials(
                {
                  ...order,
                  formulaTemplateIds: {
                    orderProfit: savedTemplates[0].id,
                  },
                },
                nextContent
              )
            : order
        ),
      }
    })
    return Response.json({ templates: savedTemplates })
  } catch (error) {
    return Response.json(
      {
        error: "formula_templates_invalid",
        message: error instanceof Error ? error.message : "公式保存失败。",
      },
      { status: 400 }
    )
  }
}

function normalizeAmount(value: unknown, fallback: unknown) {
  const number = value === undefined ? Number(fallback) : Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.round(number * 100) / 100
}

function formatOrderAmount(value: number, currency: string) {
  return `${currency.toUpperCase()} ${value.toFixed(2)}`
}

function unauthorized() {
  return Response.json(
    { error: "unauthorized", message: "Admin authentication is required." },
    { status: 401 }
  )
}
