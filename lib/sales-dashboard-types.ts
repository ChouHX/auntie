import type {
  CmsFormulaTemplate,
  CmsPaymentOrder,
  CmsPaymentProof,
} from "@/types/cms"

type SalesFilterField =
  | "addTime"
  | "auntieName"
  | "auntieSalary"
  | "cleaningType"
  | "customerName"
  | "customerType"
  | "otherCost"
  | "orderProfit"
  | "paymentAmount"
  | "region"
  | "salesCommission"
  | "salesOwner"
  | "serviceDate"
  | "note"
  | "orderId"
  | "orderStatus"

type SalesFilterOperator =
  | "after"
  | "before"
  | "contains"
  | "empty"
  | "eq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "not_contains"
  | "not_empty"
  | "neq"

type SalesFilterCondition = {
  field: SalesFilterField
  id: string
  operator: SalesFilterOperator
  value?: string
}

type SalesDashboardQuery = {
  filters: SalesFilterCondition[]
  logic: "all" | "any"
  ordersOnly?: boolean
  page: number
  pageSize: number
}

type SalesDashboardRow = {
  addTime: string
  auntieId: string
  auntieName: string
  auntieSalary: number
  cleaningType: string
  currency: string
  customerKey: string
  customerName: string
  customerRelationId: string
  customerType: string
  dealStatus: "converted" | "unconverted"
  financeNote: string
  formulaTemplateIds: CmsPaymentOrder["formulaTemplateIds"]
  note: string
  orderId: string
  orderProfit: number
  orderProfitCny?: number
  orderStatus: CmsPaymentOrder["status"] | "none"
  otherCost: number
  overdue24: boolean
  paymentAmount: number
  paymentProvider: CmsPaymentOrder["provider"] | "none"
  receivedAmount: number
  region: string
  salesCommission: number
  salesMemberId: string
  salesOwner: string
  serviceDate: string
  tipAmount: number
  zellePaymentProof?: CmsPaymentProof
  supportPaymentProof?: CmsPaymentProof
}

type SalesDashboardCurrencySummary = {
  auntieSalary: number
  convertedAmount: number
  currency: string
  orderProfit: number
  otherCost: number
  receivedAmount: number
  salesCommission: number
}

type SalesRankingItem = {
  amount: number
  currency: string
  displayLabel: string
  salesOwner: string
}

type SalesDashboardResult = {
  currencySummaries: SalesDashboardCurrencySummary[]
  customerCount: number
  convertedCustomerCount: number
  filterOptions: {
    aunties: string[]
    cleaningTypes: string[]
    currencies: string[]
    customerTypes: string[]
    regions: string[]
    salesOwners: string[]
  }
  formulaTemplates: CmsFormulaTemplate[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  rows: SalesDashboardRow[]
  salesMembers: Array<{ id: string; name: string }>
  salesRanking: SalesRankingItem[]
}

type SalesOrderFinancePatch = {
  customerRelationId?: string
  customerType?: string
  financeNote?: string
  formulaTemplateIds?: CmsPaymentOrder["formulaTemplateIds"]
  markAsOfflinePaid?: boolean
  orderId: string
  otherCost?: number
  paymentAmount?: number
  receivedAmount?: number
  salesMemberId?: string
  salesOwner?: string
  salesOwnerSource?: CmsPaymentOrder["salesOwnerSource"]
}

export type {
  SalesDashboardCurrencySummary,
  SalesDashboardQuery,
  SalesDashboardResult,
  SalesDashboardRow,
  SalesFilterCondition,
  SalesFilterField,
  SalesFilterOperator,
  SalesOrderFinancePatch,
  SalesRankingItem,
}
