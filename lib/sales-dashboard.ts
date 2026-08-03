import type { CmsContent, CmsPaymentOrder } from "@/types/cms"
import type { WecomCustomer } from "@/lib/wecom-types"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { findSalesMemberForStudentTags } from "./sales-attribution.ts"
import type {
  SalesDashboardCurrencySummary,
  SalesDashboardQuery,
  SalesDashboardResult,
  SalesDashboardRow,
  SalesFilterCondition,
} from "@/lib/sales-dashboard-types"

function createSalesDashboardResult(
  content: CmsContent,
  customers: WecomCustomer[],
  query: SalesDashboardQuery
): SalesDashboardResult {
  const allRows = createSalesRows(content, customers)
  const sourceRows = query.ordersOnly
    ? allRows.filter((row) => Boolean(row.orderId))
    : allRows
  const filteredRows = query.filters.length
    ? sourceRows.filter((row) =>
        query.logic === "any"
          ? query.filters.some((filter) => matchesFilter(row, filter))
          : query.filters.every((filter) => matchesFilter(row, filter))
      )
    : sourceRows
  const sorted = filteredRows.toSorted(
    (left, right) =>
      new Date(right.addTime).getTime() - new Date(left.addTime).getTime()
  )
  const pageSize = clamp(query.pageSize, 10, 100, 20)
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const page = Math.min(Math.max(1, Math.trunc(query.page) || 1), totalPages)

  return {
    currencySummaries: createCurrencySummaries(filteredRows),
    customerCount: countDistinctCustomers(filteredRows),
    convertedCustomerCount: countDistinctCustomers(
      filteredRows.filter((row) => row.dealStatus === "converted")
    ),
    filterOptions: createFilterOptions(sourceRows),
    formulaTemplates: content.formulaTemplates,
    pagination: {
      page,
      pageSize,
      totalCount: sorted.length,
      totalPages,
    },
    rows: sorted.slice((page - 1) * pageSize, page * pageSize),
    salesMembers: (content.salesMembers ?? [])
      .filter((member) => member.status === "active")
      .map(({ id, name }) => ({ id, name })),
    salesRanking: createSalesRanking(filteredRows),
  }
}

function createSalesRows(content: CmsContent, customers: WecomCustomer[]) {
  const salesMembers = content.salesMembers ?? []
  const customerMap = new Map(
    customers.map((customer) => [customer.relationId, customer])
  )
  const linkedCustomers = new Set<string>()
  const auntieMap = new Map(
    content.teamMembers.map((member) => [member.id, member.name])
  )
  const rows = content.paymentOrders.map((order) => {
    const customer = order.customerRelationId
      ? customerMap.get(order.customerRelationId)
      : undefined
    if (customer) linkedCustomers.add(customer.relationId)
    return createOrderRow(order, customer, auntieMap, salesMembers)
  })

  customers.forEach((customer) => {
    if (linkedCustomers.has(customer.relationId)) return
    rows.push(createCustomerRow(customer, salesMembers))
  })
  return rows
}

function createOrderRow(
  order: CmsPaymentOrder,
  customer: WecomCustomer | undefined,
  auntieMap: Map<string, string>,
  salesMembers: CmsContent["salesMembers"]
): SalesDashboardRow {
  const customerType =
    order.customerType || getCustomerType(customer?.nameAndType)
  const customerName =
    order.customerName || getCustomerName(customer?.nameAndType)
  const paymentAmount = normalizeNumber(
    order.amountValue || order.receivedAmount || order.baseAmountValue
  )
  const isTimeout =
    order.status === "cancelled" && order.failureReason === "payment_timeout"
  const tagSalesMember = findSalesMemberForStudentTags(
    customer?.studentType,
    salesMembers
  )
  const tagSalesOwner = tagSalesMember?.name ?? ""
  const storedSalesMember = salesMembers.find(
    (member) =>
      member.id === order.salesMemberId || member.name === order.salesOwner
  )
  const storedSalesOwner =
    customer &&
    (order.salesOwnerSource === "wecom_member" ||
      order.salesOwnerSource === "wecom_tag")
      ? ""
      : order.salesOwner
  return {
    addTime: customer?.addTime || order.createdAt,
    auntieId: order.assignedAuntieId || "",
    auntieName:
      auntieMap.get(order.assignedAuntieId || "") || customer?.auntie || "",
    auntieSalary: normalizeNumber(order.auntieSalary),
    cleaningType: order.serviceType,
    currency: order.currency || "USD",
    customerKey: order.customerRelationId || `order:${order.orderId}`,
    customerName,
    customerRelationId: order.customerRelationId || "",
    customerType,
    dealStatus: order.status === "paid" ? "converted" : "unconverted",
    financeNote: order.financeNote || "",
    formulaTemplateIds: order.formulaTemplateIds || {},
    note: order.note,
    orderId: order.orderId,
    orderProfit: normalizeNumber(order.orderProfit),
    orderProfitCny:
      order.orderProfitCny === undefined
        ? undefined
        : normalizeNumber(order.orderProfitCny),
    orderStatus: order.status,
    otherCost: normalizeNumber(order.otherCost),
    overdue24: isTimeout,
    paymentAmount,
    paymentProvider: order.provider ?? "airwallex",
    receivedAmount: normalizeNumber(
      order.receivedAmount ?? (order.status === "paid" ? paymentAmount : 0)
    ),
    region: order.serviceArea || customer?.region || "",
    salesCommission: normalizeNumber(order.salesCommission),
    salesMemberId: tagSalesMember?.id || storedSalesMember?.id || "",
    salesOwner: tagSalesOwner || storedSalesOwner || "",
    serviceDate: order.serviceDate || "",
  }
}

function createCustomerRow(
  customer: WecomCustomer,
  salesMembers: CmsContent["salesMembers"]
): SalesDashboardRow {
  return {
    addTime: customer.addTime,
    auntieId: "",
    auntieName: customer.auntie,
    auntieSalary: 0,
    cleaningType: "",
    currency: "",
    customerKey: customer.relationId,
    customerName: getCustomerName(customer.nameAndType),
    customerRelationId: customer.relationId,
    customerType: getCustomerType(customer.nameAndType),
    dealStatus: "unconverted",
    financeNote: "",
    formulaTemplateIds: {},
    note: customer.description,
    orderId: "",
    orderProfit: 0,
    orderProfitCny: undefined,
    orderStatus: "none",
    otherCost: 0,
    overdue24: false,
    paymentAmount: 0,
    paymentProvider: "none",
    receivedAmount: 0,
    region: customer.region,
    salesCommission: 0,
    salesMemberId:
      findSalesMemberForStudentTags(customer.studentType, salesMembers)?.id ??
      "",
    salesOwner:
      findSalesMemberForStudentTags(customer.studentType, salesMembers)?.name ??
      "",
    serviceDate: "",
  }
}

function matchesFilter(row: SalesDashboardRow, filter: SalesFilterCondition) {
  const value =
    filter.field === "note"
      ? `${row.note} ${row.financeNote}`.trim()
      : row[filter.field]
  const expected = filter.value ?? ""
  if (filter.operator === "empty")
    return value === "" || value === null || value === undefined
  if (filter.operator === "not_empty")
    return value !== "" && value !== null && value !== undefined
  if (typeof value === "number") {
    const number = Number(expected)
    if (!Number.isFinite(number)) return false
    if (filter.operator === "eq") return value === number
    if (filter.operator === "neq") return value !== number
    if (filter.operator === "gt") return value > number
    if (filter.operator === "gte") return value >= number
    if (filter.operator === "lt") return value < number
    if (filter.operator === "lte") return value <= number
    return false
  }
  if (filter.field === "addTime" || filter.field === "serviceDate") {
    const timestamp = new Date(String(value)).getTime()
    const target = new Date(expected).getTime()
    if (!Number.isFinite(timestamp) || !Number.isFinite(target)) return false
    if (filter.operator === "after") return timestamp > target
    if (filter.operator === "before") return timestamp < target
    if (filter.operator === "eq")
      return String(value).slice(0, 10) === expected.slice(0, 10)
    if (filter.operator === "neq")
      return String(value).slice(0, 10) !== expected.slice(0, 10)
    return false
  }
  const actual = String(value).toLocaleLowerCase()
  const normalizedExpected = expected.toLocaleLowerCase()
  if (filter.operator === "contains") return actual.includes(normalizedExpected)
  if (filter.operator === "not_contains")
    return !actual.includes(normalizedExpected)
  if (filter.operator === "eq") return actual === normalizedExpected
  if (filter.operator === "neq") return actual !== normalizedExpected
  return false
}

function createCurrencySummaries(rows: SalesDashboardRow[]) {
  const map = new Map<string, SalesDashboardCurrencySummary>()
  rows.forEach((row) => {
    if (!row.currency || !row.orderId) return
    const summary = map.get(row.currency) ?? {
      auntieSalary: 0,
      convertedAmount: 0,
      currency: row.currency,
      orderProfit: 0,
      otherCost: 0,
      receivedAmount: 0,
      salesCommission: 0,
    }
    if (row.orderStatus === "paid") summary.convertedAmount += row.paymentAmount
    summary.receivedAmount += row.receivedAmount
    summary.auntieSalary += row.auntieSalary
    summary.otherCost += row.otherCost
    summary.salesCommission += row.salesCommission
    summary.orderProfit += row.orderProfit
    map.set(row.currency, summary)
  })
  return Array.from(map.values()).map(
    (summary) =>
      Object.fromEntries(
        Object.entries(summary).map(([key, value]) => [
          key,
          typeof value === "number" ? roundMoney(value) : value,
        ])
      ) as SalesDashboardCurrencySummary
  )
}

function createSalesRanking(rows: SalesDashboardRow[]) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    if (row.orderStatus !== "paid" || !row.salesOwner || !row.currency) return
    const key = `${row.currency}\u0000${row.salesOwner}`
    map.set(key, (map.get(key) ?? 0) + row.paymentAmount)
  })
  return Array.from(map.entries())
    .map(([key, amount]) => {
      const [currency, salesOwner] = key.split("\u0000")
      return {
        amount: roundMoney(amount),
        currency,
        displayLabel: `${salesOwner} (${currency})`,
        salesOwner,
      }
    })
    .toSorted((left, right) => right.amount - left.amount)
}

function createFilterOptions(rows: SalesDashboardRow[]) {
  const unique = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).toSorted((a, b) =>
      a.localeCompare(b, "zh-CN")
    )
  return {
    aunties: unique(rows.map((row) => row.auntieName)),
    cleaningTypes: unique(rows.map((row) => row.cleaningType)),
    currencies: unique(rows.map((row) => row.currency)),
    customerTypes: unique(rows.map((row) => row.customerType)),
    regions: unique(rows.map((row) => row.region)),
    salesOwners: unique(rows.map((row) => row.salesOwner)),
  }
}

function countDistinctCustomers(rows: SalesDashboardRow[]) {
  return new Set(rows.map((row) => row.customerKey)).size
}

function getCustomerName(value = "") {
  return value.split("@")[0]?.trim() || ""
}
function getCustomerType(value = "") {
  return value.split("@").at(-1)?.trim() || ""
}
function normalizeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
function clamp(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.trunc(value)))
    : fallback
}

export { createSalesDashboardResult }
