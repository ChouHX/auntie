"use client"

import { type ReactNode, useEffect, useState } from "react"
import {
  Calculator,
  CaretLeft,
  CaretRight,
  ClipboardText,
  CurrencyDollar,
  DotsThree,
  Eye,
  FloppyDisk,
  Funnel,
  PencilSimple,
  Plus,
  Trash,
  Users,
  X,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  fetchSalesDashboard,
  saveSalesFormulaTemplates,
  updateSalesOrderFinance,
  deleteSupportPaymentProof,
  uploadSupportPaymentProof,
} from "@/lib/cms-api"
import { ImagePreviewer } from "@/components/ui/image-previewer"
import {
  formatFormulaTokens,
  formulaFieldLabels,
  validateFormulaTokens,
} from "@/lib/sales-formula"
import type {
  SalesDashboardQuery,
  SalesDashboardResult,
  SalesDashboardRow,
  SalesFilterCondition,
  SalesFilterField,
  SalesFilterOperator,
  SalesOrderFinancePatch,
} from "@/lib/sales-dashboard-types"
import type {
  CmsFormulaField,
  CmsFormulaTemplate,
  CmsFormulaToken,
} from "@/types/cms"

const emptyQuery: SalesDashboardQuery = {
  filters: [],
  logic: "all",
  ordersOnly: true,
  page: 1,
  pageSize: 20,
}

const fieldDefinitions: Array<{
  field: SalesFilterField
  label: string
  type: "date" | "enum" | "number" | "text"
}> = [
  { field: "addTime", label: "添加时间", type: "date" },
  { field: "customerName", label: "客户名称", type: "text" },
  { field: "orderId", label: "订单号", type: "text" },
  { field: "orderStatus", label: "订单状态", type: "enum" },
  { field: "salesOwner", label: "学员/销售", type: "text" },
  { field: "region", label: "地区", type: "text" },
  { field: "auntieName", label: "对接阿姨", type: "text" },
  { field: "cleaningType", label: "清洁类型", type: "text" },
  { field: "paymentAmount", label: "订单金额", type: "number" },
  { field: "auntieSalary", label: "阿姨薪资", type: "number" },
  { field: "otherCost", label: "其他成本", type: "number" },
  { field: "salesCommission", label: "学员提成", type: "number" },
  { field: "orderProfit", label: "公司利润", type: "number" },
  { field: "serviceDate", label: "服务日期", type: "date" },
  { field: "note", label: "备注", type: "text" },
]

const textOperators = [
  ["contains", "包含"],
  ["not_contains", "不包含"],
  ["eq", "等于"],
  ["neq", "不等于"],
  ["empty", "为空"],
  ["not_empty", "不为空"],
] as const
const numberOperators = [
  ["eq", "等于"],
  ["neq", "不等于"],
  ["gt", "大于"],
  ["gte", "大于等于"],
  ["lt", "小于"],
  ["lte", "小于等于"],
  ["empty", "为空"],
  ["not_empty", "不为空"],
] as const
const dateOperators = [
  ["eq", "等于"],
  ["neq", "不等于"],
  ["after", "晚于"],
  ["before", "早于"],
  ["empty", "为空"],
  ["not_empty", "不为空"],
] as const
const enumOperators = [
  ["eq", "等于"],
  ["neq", "不等于"],
  ["empty", "为空"],
  ["not_empty", "不为空"],
] as const

const rankingConfig = {
  amount: { color: "var(--chart-1)", label: "订单金额" },
} satisfies ChartConfig

const salesRankingColors = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4f46e5",
  "#65a30d",
  "#ea580c",
]

export function SalesDashboardAdmin({ token }: { token: string }) {
  const [query, setQuery] = useState<SalesDashboardQuery>(emptyQuery)
  const [draftFilters, setDraftFilters] = useState<SalesFilterCondition[]>([])
  const [logic, setLogic] = useState<"all" | "any">("all")
  const [data, setData] = useState<SalesDashboardResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchSalesDashboard(token, query)
      .then((result) => mounted && setData(result))
      .catch(
        (error) =>
          mounted &&
          toast.error(
            error instanceof Error ? error.message : "销售数据加载失败"
          )
      )
      .finally(() => mounted && setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [query, token])

  function applyFilters() {
    setIsLoading(true)
    setQuery((current) => ({
      ...current,
      filters: draftFilters,
      logic,
      page: 1,
    }))
    setFilterOpen(false)
  }

  const summaries = data?.currencySummaries ?? []
  const metrics = [
    {
      label: "客户数",
      value: String(data?.customerCount ?? 0),
      icon: <Users size={18} weight="fill" />,
    },
    {
      label: "成交客户数",
      value: String(data?.convertedCustomerCount ?? 0),
      icon: <Users size={18} weight="fill" />,
    },
    {
      label: "订单金额",
      value: formatSummaryValues(summaries, "convertedAmount"),
      icon: <CurrencyDollar size={18} weight="fill" />,
    },
    {
      label: "阿姨薪资",
      value: formatSummaryValues(summaries, "auntieSalary"),
      icon: <Calculator size={18} />,
    },
    {
      label: "其他成本",
      value: formatSummaryValues(summaries, "otherCost"),
      icon: <Calculator size={18} />,
    },
    {
      label: "学员提成",
      value: formatSummaryValues(summaries, "salesCommission"),
      icon: <Calculator size={18} />,
    },
    {
      label: "公司利润",
      value: formatSummaryValues(summaries, "orderProfit"),
      icon: <CurrencyDollar size={18} weight="fill" />,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {metrics.map((metric) => (
          <Card className="min-w-0 rounded-lg p-3 shadow-sm" key={metric.label}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-primary">{metric.icon}</span>
              {metric.label}
            </div>
            <div className="mt-2 min-h-8 text-xs leading-5 font-semibold break-words text-foreground">
              {metric.value}
            </div>
          </Card>
        ))}
      </div>

      <DashboardDetailTable
        action={
          <SalesFilterPopover
            appliedCount={query.filters.length}
            data={data}
            filters={draftFilters}
            logic={logic}
            onApply={applyFilters}
            onFiltersChange={setDraftFilters}
            onLogicChange={setLogic}
            onOpenChange={(open) => {
              setFilterOpen(open)
              if (open) {
                setDraftFilters(query.filters)
                setLogic(query.logic)
              }
            }}
            onReset={() => {
              setDraftFilters([])
              setLogic("all")
              setIsLoading(true)
              setQuery((current) => ({
                ...current,
                filters: [],
                logic: "all",
                page: 1,
              }))
              setFilterOpen(false)
            }}
            open={filterOpen}
          />
        }
        data={data}
        isLoading={isLoading}
        onPageChange={(page) => {
          setIsLoading(true)
          setQuery((current) => ({ ...current, page }))
        }}
        onPageSizeChange={(pageSize) => {
          setIsLoading(true)
          setQuery((current) => ({ ...current, page: 1, pageSize }))
        }}
      />

      <Card className="rounded-lg p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">销售排行榜</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              按当前筛选结果的订单金额从高到低排列；不同币种分别统计。
            </p>
          </div>
          {isLoading ? <Badge variant="secondary">加载中</Badge> : null}
        </div>
        {data?.salesRanking.length ? (
          <ChartContainer className="h-[300px] w-full" config={rankingConfig}>
            <BarChart
              data={data.salesRanking.slice(0, 20)}
              margin={{ left: 4, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="displayLabel" tickLine={false} axisLine={false} />
              <YAxis
                label={{ angle: -90, position: "insideLeft", value: "金额" }}
                tickLine={false}
                axisLine={false}
                width={58}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    valueFormatter={(value, item) =>
                      `${String(item.payload?.currency ?? "")} ${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
                    }
                  />
                }
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {data.salesRanking.slice(0, 20).map((item) => (
                  <Cell
                    fill={getSalesRankingColor(item.salesOwner)}
                    key={`${item.currency}-${item.salesOwner}`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            当前筛选结果暂无销售归属数据
          </div>
        )}
      </Card>
    </div>
  )
}

function DashboardDetailTable({
  action,
  data,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: {
  action: ReactNode
  data: SalesDashboardResult | null
  isLoading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const pagination = data?.pagination

  return (
    <Card className="overflow-hidden rounded-lg shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-4">
        <div>
          <h2 className="text-sm font-semibold">客户 / 订单明细</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            共 {pagination?.totalCount ?? 0} 条，与当前筛选条件同步
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? <Badge variant="secondary">加载中</Badge> : null}
          {action}
        </div>
      </div>
      <Table className="min-w-[1720px] text-xs [&_td]:px-2 [&_th]:px-2">
        <TableHeader>
          <TableRow>
            <TableHead>客户</TableHead>
            <TableHead>订单号</TableHead>
            <TableHead>订单状态</TableHead>
            <TableHead>学员/销售</TableHead>
            <TableHead>地区</TableHead>
            <TableHead>对接阿姨</TableHead>
            <TableHead>清洁类型</TableHead>
            <TableHead>服务日期</TableHead>
            <TableHead>订单金额</TableHead>
            <TableHead>阿姨薪资</TableHead>
            <TableHead>其他成本</TableHead>
            <TableHead>学员提成</TableHead>
            <TableHead>公司利润</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.rows.length ? (
            data.rows.map((row) => (
              <TableRow key={`${row.customerKey}-${row.orderId || "customer"}`}>
                <TableCell>
                  <div className="font-medium">
                    {row.customerName || "未填写"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateTime(row.addTime)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {row.orderId || "暂无订单"}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge row={row} />
                </TableCell>
                <TableCell>{row.salesOwner || "未归属"}</TableCell>
                <TableCell>{row.region || "-"}</TableCell>
                <TableCell>{row.auntieName || "未分配"}</TableCell>
                <TableCell>{row.cleaningType || "-"}</TableCell>
                <TableCell>{row.serviceDate || "待确认"}</TableCell>
                <TableCell>
                  {row.orderId
                    ? formatMoney(row.currency, row.paymentAmount)
                    : "-"}
                </TableCell>
                <TableCell>
                  {row.orderId
                    ? formatMoney(row.currency, row.auntieSalary)
                    : "-"}
                </TableCell>
                <TableCell>
                  {row.orderId ? formatMoney(row.currency, row.otherCost) : "-"}
                </TableCell>
                <TableCell>
                  {row.orderId
                    ? formatMoney(row.currency, row.salesCommission)
                    : "-"}
                </TableCell>
                <TableCell
                  className={
                    row.orderProfit < 0
                      ? "text-destructive"
                      : "text-emerald-600"
                  }
                >
                  {row.orderId ? <CompanyProfitValue row={row} /> : "-"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="h-28 text-center text-muted-foreground"
                colSpan={13}
              >
                {isLoading ? "正在加载明细..." : "没有符合条件的客户或订单"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DashboardPagination
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pagination={pagination}
      />
    </Card>
  )
}

function DashboardPagination({
  onPageChange,
  onPageSizeChange,
  pagination,
}: {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pagination: SalesDashboardResult["pagination"] | undefined
}) {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? emptyQuery.pageSize
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div className="flex items-center justify-between border-t border-border px-3 py-2">
      <Select
        onValueChange={(value) => onPageSizeChange(Number(value))}
        value={String(pageSize)}
      >
        <SelectTrigger className="h-8 w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 20, 50, 100].map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size} 条
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          第 {page} / {totalPages} 页
        </span>
        <Button
          aria-label="上一页"
          className="size-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon-sm"
          variant="outline"
        >
          <CaretLeft size={14} />
        </Button>
        <Button
          aria-label="下一页"
          className="size-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="icon-sm"
          variant="outline"
        >
          <CaretRight size={14} />
        </Button>
      </div>
    </div>
  )
}

export function SalesOrderDataPanel({
  isSaving,
  onCopyOrder,
  onCreateOrder,
  onDeleteOrder,
  onOpenOrder,
  refreshKey,
  token,
}: {
  isSaving: boolean
  onCopyOrder: (orderId: string) => Promise<void>
  onCreateOrder: () => void
  onDeleteOrder: (orderId: string) => Promise<void>
  onOpenOrder: (orderId: string) => Promise<void>
  refreshKey: string
  token: string
}) {
  const [query, setQuery] = useState<SalesDashboardQuery>({
    ...emptyQuery,
    ordersOnly: true,
  })
  const [draftFilters, setDraftFilters] = useState<SalesFilterCondition[]>([])
  const [logic, setLogic] = useState<"all" | "any">("all")
  const [data, setData] = useState<SalesDashboardResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<SalesDashboardRow | null>(null)
  const [formulaOpen, setFormulaOpen] = useState(false)
  const [formulaDrafts, setFormulaDrafts] = useState<CmsFormulaTemplate[]>([])
  const [editingFormula, setEditingFormula] =
    useState<CmsFormulaTemplate | null>(null)

  useEffect(() => {
    let mounted = true
    fetchSalesDashboard(token, query)
      .then((result) => {
        if (!mounted) return
        setData(result)
        setFormulaDrafts(result.formulaTemplates)
      })
      .catch(
        (error) =>
          mounted &&
          toast.error(
            error instanceof Error ? error.message : "经营明细加载失败"
          )
      )
      .finally(() => mounted && setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [query, refreshKey, reloadKey, token])

  async function saveFinance(patch: SalesOrderFinancePatch) {
    try {
      await updateSalesOrderFinance(token, patch)
      toast.success("经营数据已保存")
      setFinanceOpen(false)
      setReloadKey((value) => value + 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "经营数据保存失败")
    }
  }

  async function saveFormula(template: CmsFormulaTemplate) {
    try {
      validateFormulaTokens(template.tokens)
      const result = await saveSalesFormulaTemplates(token, [template])
      setFormulaDrafts(result.templates)
      setEditingFormula(null)
      setFormulaOpen(false)
      setReloadKey((value) => value + 1)
      toast.success("公司利润规则已保存")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "公式保存失败")
    }
  }

  function openFormulaEditor() {
    const formula = formulaDrafts[0]
    if (!formula) return
    setEditingFormula(structuredClone(formula))
    setFormulaOpen(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">订单管理</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            共 {data?.pagination.totalCount ?? 0} 条订单
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SalesFilterPopover
            appliedCount={query.filters.length}
            data={data}
            filters={draftFilters}
            logic={logic}
            onApply={() => {
              setQuery((current) => ({
                ...current,
                filters: draftFilters,
                logic,
                page: 1,
              }))
              setFilterOpen(false)
            }}
            onFiltersChange={setDraftFilters}
            onLogicChange={setLogic}
            onOpenChange={(open) => {
              setFilterOpen(open)
              if (open) {
                setDraftFilters(query.filters)
                setLogic(query.logic)
              }
            }}
            onReset={() => {
              setDraftFilters([])
              setLogic("all")
              setQuery((current) => ({
                ...current,
                filters: [],
                logic: "all",
                page: 1,
              }))
              setFilterOpen(false)
            }}
            open={filterOpen}
          />
          <Button
            className="h-8"
            disabled={!formulaDrafts[0]}
            onClick={openFormulaEditor}
            size="sm"
            variant="outline"
          >
            <Calculator size={15} />
            计算规则
          </Button>
          <Button
            className="h-8"
            disabled={isSaving}
            onClick={onCreateOrder}
            size="sm"
          >
            <Plus size={15} weight="bold" />
            新建付款订单
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg shadow-sm">
        <Table className="min-w-[2180px] text-xs [&_td]:px-2 [&_th]:px-2">
          <TableHeader>
            <TableRow>
              <TableHead className="lg:sticky lg:left-0 lg:z-20 lg:bg-card">
                订单号
              </TableHead>
              <TableHead>客户</TableHead>
              <TableHead>订单状态</TableHead>
              <TableHead>学员/销售</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>对接阿姨</TableHead>
              <TableHead>清洁类型</TableHead>
              <TableHead>服务日期</TableHead>
              <TableHead>订单金额</TableHead>
              <TableHead>阿姨薪资</TableHead>
              <TableHead>其他成本</TableHead>
              <TableHead>学员提成</TableHead>
              <TableHead>公司利润</TableHead>
              <TableHead>付款链接</TableHead>
              <TableHead>备注</TableHead>
              <TableHead className="sticky right-0 z-20 w-12 min-w-12 border-l border-border bg-card text-center lg:min-w-40 lg:text-right">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.rows.length ? (
              data.rows.map((row) => (
                <TableRow
                  className="group"
                  key={`${row.customerKey}-${row.orderId || "customer"}`}
                >
                  <TableCell className="whitespace-nowrap group-hover:bg-muted lg:sticky lg:left-0 lg:z-10 lg:bg-card">
                    <div className="font-semibold">{row.orderId}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDateTime(row.addTime)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.customerName || "未填写"}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge row={row} />
                  </TableCell>
                  <TableCell>{row.salesOwner || "未归属"}</TableCell>
                  <TableCell>{row.region || "-"}</TableCell>
                  <TableCell>{row.auntieName || "未分配"}</TableCell>
                  <TableCell>{row.cleaningType || "-"}</TableCell>
                  <TableCell>{row.serviceDate || "待确认"}</TableCell>
                  <TableCell>
                    {formatMoney(row.currency, row.paymentAmount)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(row.currency, row.auntieSalary)}
                  </TableCell>
                  <TableCell>
                    {row.orderId ? (
                      <InlineCost row={row} onSave={saveFinance} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {formatMoney(row.currency, row.salesCommission)}
                  </TableCell>
                  <TableCell
                    className={
                      row.orderProfit < 0
                        ? "text-destructive"
                        : "text-emerald-600"
                    }
                  >
                    <CompanyProfitValue row={row} />
                  </TableCell>
                  <TableCell>
                    <PaymentOrderLink
                      orderId={row.orderId}
                      status={row.orderStatus}
                    />
                  </TableCell>
                  <TableCell
                    className="max-w-56 truncate"
                    title={[row.note, row.financeNote]
                      .filter(Boolean)
                      .join("；")}
                  >
                    {[row.note, row.financeNote].filter(Boolean).join("；") ||
                      "-"}
                  </TableCell>
                  <TableCell className="sticky right-0 z-10 border-l border-border bg-card text-center group-hover:bg-muted lg:min-w-40 lg:text-right">
                    <div className="flex justify-center gap-1 lg:justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label="打开订单操作菜单"
                            className="size-8 rounded-full lg:hidden"
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <DotsThree size={18} weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg">
                          <DropdownMenuItem
                            onClick={() => void onCopyOrder(row.orderId)}
                          >
                            <ClipboardText size={15} />
                            复制预约信息
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void onOpenOrder(row.orderId)}
                          >
                            {isCompletedSalesOrder(row) ? (
                              <Eye size={15} />
                            ) : (
                              <PencilSimple size={15} />
                            )}
                            {isCompletedSalesOrder(row)
                              ? "查看订单"
                              : "编辑订单"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingRow(row)
                              setFinanceOpen(true)
                            }}
                          >
                            <Calculator size={15} />
                            编辑经营数据
                          </DropdownMenuItem>
                          {!isCompletedSalesOrder(row) ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isSaving}
                                onClick={() => void onDeleteOrder(row.orderId)}
                                variant="destructive"
                              >
                                <Trash size={15} />
                                删除订单
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="hidden gap-1 lg:flex">
                        <Button
                          aria-label="复制预约信息"
                          className="size-8"
                          onClick={() => void onCopyOrder(row.orderId)}
                          size="icon-sm"
                          variant="navIcon"
                        >
                          <ClipboardText size={14} />
                        </Button>
                        <Button
                          aria-label={
                            isCompletedSalesOrder(row) ? "查看订单" : "编辑订单"
                          }
                          className="size-8"
                          onClick={() => void onOpenOrder(row.orderId)}
                          size="icon-sm"
                          variant="navIcon"
                        >
                          {isCompletedSalesOrder(row) ? (
                            <Eye size={14} />
                          ) : (
                            <PencilSimple size={14} />
                          )}
                        </Button>
                        <Button
                          aria-label="编辑经营数据"
                          className="size-8"
                          onClick={() => {
                            setEditingRow(row)
                            setFinanceOpen(true)
                          }}
                          size="icon-sm"
                          variant="navIcon"
                        >
                          <Calculator size={14} />
                        </Button>
                        {!isCompletedSalesOrder(row) ? (
                          <Button
                            aria-label="删除订单"
                            className="size-8"
                            disabled={isSaving}
                            onClick={() => void onDeleteOrder(row.orderId)}
                            size="icon-sm"
                            variant="destructive"
                          >
                            <Trash size={14} />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-28 text-center text-muted-foreground"
                  colSpan={16}
                >
                  {isLoading ? "正在加载订单..." : "没有符合条件的订单"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <Select
            onValueChange={(value) =>
              setQuery((current) => ({
                ...current,
                page: 1,
                pageSize: Number(value),
              }))
            }
            value={String(query.pageSize)}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} 条
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              第 {data?.pagination.page ?? 1} /{" "}
              {data?.pagination.totalPages ?? 1} 页
            </span>
            <Button
              className="size-8"
              disabled={(data?.pagination.page ?? 1) <= 1}
              onClick={() =>
                setQuery((current) => ({ ...current, page: current.page - 1 }))
              }
              size="icon-sm"
              variant="outline"
            >
              <CaretLeft size={14} />
            </Button>
            <Button
              className="size-8"
              disabled={
                (data?.pagination.page ?? 1) >=
                (data?.pagination.totalPages ?? 1)
              }
              onClick={() =>
                setQuery((current) => ({ ...current, page: current.page + 1 }))
              }
              size="icon-sm"
              variant="outline"
            >
              <CaretRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      <FinanceDialog
        salesMembers={data?.salesMembers ?? []}
        token={token}
        onOpenChange={setFinanceOpen}
        onRowChange={setEditingRow}
        onSave={saveFinance}
        open={financeOpen}
        row={editingRow}
      />
      <FormulaEditorDialog
        formula={editingFormula}
        onChange={setEditingFormula}
        onOpenChange={(open) => {
          setFormulaOpen(open)
          if (!open) setEditingFormula(null)
        }}
        onSave={(formula) => void saveFormula(formula)}
        open={formulaOpen}
      />
    </div>
  )
}

function SalesFilterPopover({
  appliedCount,
  data,
  filters,
  logic,
  onApply,
  onFiltersChange,
  onLogicChange,
  onOpenChange,
  onReset,
  open,
}: {
  appliedCount: number
  data: SalesDashboardResult | null
  filters: SalesFilterCondition[]
  logic: "all" | "any"
  onApply: () => void
  onFiltersChange: (filters: SalesFilterCondition[]) => void
  onLogicChange: (logic: "all" | "any") => void
  onOpenChange: (open: boolean) => void
  onReset: () => void
  open: boolean
}) {
  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="h-8"
          size="sm"
          variant={appliedCount ? "secondary" : "outline"}
        >
          <Funnel size={14} />
          筛选{appliedCount ? ` ${appliedCount}` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(44rem,calc(100vw-2rem))] p-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">筛选条件</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              应用后更新当前页面的数据。
            </div>
          </div>
          <Select onValueChange={onLogicChange} value={logic}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">满足全部条件</SelectItem>
              <SelectItem value="any">满足任意条件</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="my-3 max-h-[55vh] space-y-2 overflow-y-auto">
          {filters.length ? (
            filters.map((filter) => (
              <FilterRow
                data={data}
                filter={filter}
                key={filter.id}
                onChange={(next) =>
                  onFiltersChange(
                    filters.map((item) => (item.id === next.id ? next : item))
                  )
                }
                onRemove={() =>
                  onFiltersChange(
                    filters.filter((item) => item.id !== filter.id)
                  )
                }
              />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              尚未添加筛选条件
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Button
            className="h-8"
            onClick={() => onFiltersChange([...filters, createFilter()])}
            size="sm"
            variant="outline"
          >
            <Plus size={14} />
            添加条件
          </Button>
          <div className="flex gap-2">
            <Button className="h-8" onClick={onReset} size="sm" variant="ghost">
              重置
            </Button>
            <Button className="h-8" onClick={onApply} size="sm">
              <Funnel size={14} />
              应用
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FilterRow({
  data,
  filter,
  onChange,
  onRemove,
}: {
  data: SalesDashboardResult | null
  filter: SalesFilterCondition
  onChange: (filter: SalesFilterCondition) => void
  onRemove: () => void
}) {
  const definition =
    fieldDefinitions.find((item) => item.field === filter.field) ??
    fieldDefinitions[0]
  const operators =
    definition.type === "number"
      ? numberOperators
      : definition.type === "date"
        ? dateOperators
        : definition.type === "enum"
          ? enumOperators
          : textOperators
  const noValue = filter.operator === "empty" || filter.operator === "not_empty"
  const options = getFilterOptions(definition.field, data)
  return (
    <div className="grid gap-2 sm:grid-cols-[160px_130px_minmax(160px,1fr)_32px]">
      <Select
        onValueChange={(field: SalesFilterField) => {
          const next = fieldDefinitions.find((item) => item.field === field)!
          onChange({
            ...filter,
            field,
            operator: getDefaultOperator(next.type),
            value: "",
          })
        }}
        value={filter.field}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fieldDefinitions.map((item) => (
            <SelectItem key={item.field} value={item.field}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(operator: SalesFilterOperator) =>
          onChange({ ...filter, operator })
        }
        value={filter.operator}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {noValue ? (
        <div className="h-8 rounded-md border border-dashed border-border bg-muted/30" />
      ) : options.length ? (
        <Select
          onValueChange={(value) => onChange({ ...filter, value })}
          value={filter.value || ""}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="选择值" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          className="h-8"
          onChange={(event) =>
            onChange({ ...filter, value: event.target.value })
          }
          placeholder="输入筛选值"
          type={
            definition.type === "number"
              ? "number"
              : definition.type === "date"
                ? "date"
                : "text"
          }
          value={filter.value || ""}
        />
      )}
      <Button
        aria-label="删除筛选条件"
        className="size-8"
        onClick={onRemove}
        size="icon-sm"
        variant="ghost"
      >
        <X size={14} />
      </Button>
    </div>
  )
}

function PaymentOrderLink({
  orderId,
  status,
}: {
  orderId: string
  status: SalesDashboardRow["orderStatus"]
}) {
  if (status === "awaiting_confirmation")
    return <span className="text-muted-foreground">确认报价后生成</span>
  const path = `/?order=${encodeURIComponent(orderId)}`
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      toast.success("付款链接已复制")
    } catch {
      toast.error("复制失败，请手动复制链接")
    }
  }
  return (
    <div className="flex min-w-0 items-center gap-1">
      <a
        className="max-w-44 truncate text-primary underline-offset-4 hover:underline"
        href={path}
        target="_blank"
      >
        {path}
      </a>
      <Button
        aria-label="复制付款链接"
        className="size-7"
        onClick={copyLink}
        size="icon-sm"
        variant="navIcon"
      >
        <ClipboardText size={13} />
      </Button>
    </div>
  )
}

function getOrderStatusLabel(status: SalesDashboardRow["orderStatus"]) {
  return {
    awaiting_confirmation: "待客服确认",
    cancelled: "已取消",
    failed: "支付失败",
    none: "未知",
    paid: "已付款",
    pending: "支付中",
    unpaid: "待付款",
  }[status]
}

function OrderStatusBadge({ row }: { row: SalesDashboardRow }) {
  const label = row.overdue24
    ? "已取消 · 超时 24 小时"
    : row.orderStatus === "paid" && row.paymentProvider === "offline"
      ? "已付款（公司账户）"
      : getOrderStatusLabel(row.orderStatus)
  const className = row.overdue24
    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
    : {
        awaiting_confirmation:
          "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200",
        cancelled:
          "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-400/20 dark:bg-zinc-400/10 dark:text-zinc-200",
        failed:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200",
        none: "border-border bg-muted text-muted-foreground",
        paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
        pending:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200",
        unpaid:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
      }[row.orderStatus]

  return (
    <Badge className={className} variant="secondary">
      {label}
    </Badge>
  )
}

function isCompletedSalesOrder(row: SalesDashboardRow) {
  if (row.orderStatus !== "paid" || !row.serviceDate) return false
  const serviceDate = new Date(row.serviceDate)
  if (Number.isNaN(serviceDate.getTime())) return false
  serviceDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return serviceDate < today
}

function FinanceDialog({
  onOpenChange,
  onRowChange,
  onSave,
  open,
  row,
  salesMembers,
  token,
}: {
  onOpenChange: (open: boolean) => void
  onRowChange: (row: SalesDashboardRow | null) => void
  onSave: (patch: SalesOrderFinancePatch) => Promise<void>
  open: boolean
  row: SalesDashboardRow | null
  salesMembers: Array<{ id: string; name: string }>
  token: string
}) {
  const [confirmOfflinePayment, setConfirmOfflinePayment] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [isUploadingProof, setIsUploadingProof] = useState(false)
  const [proofError, setProofError] = useState("")
  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // Clear the preview before the dialog exit animation starts. The image
      // preview is force-mounted through a portal and would otherwise reopen
      // with the previous image when this dialog is opened again.
      setPreviewIndex(null)
    }
    onOpenChange(nextOpen)
  }

  const update = (patch: Partial<SalesDashboardRow>) =>
    onRowChange(row ? { ...row, ...patch } : row)

  async function handleSupportProofSelect(file: File) {
    if (!row) return

    setIsUploadingProof(true)
    setProofError("")
    try {
      const result = await uploadSupportPaymentProof(token, row.orderId, file)
      update({ supportPaymentProof: result.order.supportPaymentProof })
    } catch (error) {
      setProofError(error instanceof Error ? error.message : "凭证上传失败。")
    } finally {
      setIsUploadingProof(false)
    }
  }

  async function handleSupportProofDelete() {
    if (!row) return false

    setIsUploadingProof(true)
    setProofError("")
    try {
      const result = await deleteSupportPaymentProof(token, row.orderId)
      update({ supportPaymentProof: result.order.supportPaymentProof })
      return true
    } catch (error) {
      setProofError(error instanceof Error ? error.message : "凭证删除失败。")
      return false
    } finally {
      setIsUploadingProof(false)
    }
  }

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogContent
        className="max-h-[min(90vh,760px)] max-w-2xl gap-3 overflow-hidden p-4 sm:p-5"
        onInteractOutside={(event) => {
          if (previewIndex !== null) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          if (previewIndex !== null) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border/70 pr-8 pb-3">
          <DialogTitle>订单经营数据</DialogTitle>
          <DialogDescription>
            {row?.orderId ?? "订单"} ·
            填写实际数据后，系统按当前计算规则更新结果。
          </DialogDescription>
        </DialogHeader>
        {row ? (
          <div className="min-h-0 overflow-y-auto pr-1">
            <section>
              <div className="mb-2 text-xs font-semibold text-foreground">
                财务录入
              </div>
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/15 p-3 sm:grid-cols-2">
                <FormField className="space-y-1.5" label="所属学员">
                  <Select
                    onValueChange={(salesMemberId) => {
                      const member = salesMembers.find(
                        (item) => item.id === salesMemberId
                      )
                      update({
                        salesMemberId:
                          salesMemberId === "unassigned" ? "" : salesMemberId,
                        salesOwner: member?.name ?? "",
                      })
                    }}
                    value={row.salesMemberId || "unassigned"}
                  >
                    <SelectTrigger className="h-8 px-2.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">未归属</SelectItem>
                      {salesMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  className="space-y-1.5"
                  label={`订单金额（${row.currency}）`}
                >
                  <NumberInput
                    className="h-8 px-2.5 text-sm"
                    min="0"
                    onValueChange={(paymentAmount) =>
                      update({ paymentAmount, receivedAmount: paymentAmount })
                    }
                    step="0.01"
                    value={row.paymentAmount}
                  />
                </FormField>
                <FormField
                  className="space-y-1.5"
                  description={
                    row.orderStatus === "paid"
                      ? row.paymentProvider === "offline"
                        ? "该订单已确认为公司账户收款。"
                        : "该订单已通过线上支付完成。"
                      : "填写订单金额后仍需明确确认，系统才会将订单标记为已付款。"
                  }
                  label="公司账户收款"
                >
                  <label className="flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-sm">
                    <Checkbox
                      checked={
                        row.paymentProvider === "offline" ||
                        confirmOfflinePayment
                      }
                      disabled={row.orderStatus === "paid"}
                      onCheckedChange={(checked) =>
                        setConfirmOfflinePayment(checked === true)
                      }
                    />
                    <span>确认已通过公司账户收款</span>
                  </label>
                </FormField>
                <FormField
                  className="space-y-1.5"
                  label={`其他成本（${row.currency}）`}
                >
                  <NumberInput
                    className="h-8 px-2.5 text-sm"
                    min="0"
                    onValueChange={(otherCost) => update({ otherCost })}
                    step="0.01"
                    value={row.otherCost}
                  />
                </FormField>
                <FormField
                  className="space-y-1.5 sm:col-span-2"
                  label="经营备注"
                >
                  <Textarea
                    className="min-h-16 px-2.5 py-2 text-sm"
                    onChange={(event) =>
                      update({ financeNote: event.target.value })
                    }
                    placeholder="例如：给阿姨报销邮费 20"
                    value={row.financeNote}
                  />
                </FormField>
              </div>
            </section>
            <section className="mt-3">
              <div className="mb-2 text-xs font-semibold text-foreground">
                计算结果
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">阿姨薪资</span>
                  <strong className="mt-1 block">
                    {formatMoney(row.currency, row.auntieSalary)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">学员提成</span>
                  <strong className="mt-1 block">
                    {formatMoney(row.currency, row.salesCommission)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">用户小费</span>
                  <strong className="mt-1 block">
                    {formatMoney(row.currency, row.tipAmount)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">公司利润</span>
                  <strong className="mt-1 block">
                    <CompanyProfitValue row={row} />
                  </strong>
                </div>
              </div>
            </section>
            <section className="mt-3">
              <div className="mb-2 text-xs font-semibold text-foreground">
                付款与凭证
              </div>
              <div className="grid gap-3 rounded-xl border border-border/70 p-3 sm:grid-cols-2">
                <ProofPanel
                  label="用户支付凭证"
                  proof={row.zellePaymentProof}
                  onPreview={() => setPreviewIndex(0)}
                />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    客服确认凭证
                  </div>
                  <input
                    accept="image/*"
                    className="sr-only"
                    id={`support-proof-${row.orderId}`}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.currentTarget.value = ""
                      if (!file) return
                      void handleSupportProofSelect(file)
                    }}
                    disabled={isUploadingProof}
                    type="file"
                  />
                  {row.supportPaymentProof ? (
                    <div className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <ProofPanel
                          label="客服确认凭证"
                          proof={row.supportPaymentProof}
                          onPreview={() =>
                            setPreviewIndex(row.zellePaymentProof ? 1 : 0)
                          }
                          onDelete={async () => {
                            await handleSupportProofDelete()
                          }}
                          deleting={isUploadingProof}
                          showLabel={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <label
                      className="mt-1 flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-dashed border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
                      htmlFor={`support-proof-${row.orderId}`}
                    >
                      {isUploadingProof ? "上传中..." : "选择客服确认凭证"}
                    </label>
                  )}
                  {proofError ? (
                    <p className="mt-1 text-xs text-destructive">
                      {proofError}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
            <ImagePreviewer
              images={[
                ...(row.zellePaymentProof
                  ? [
                      {
                        alt: "用户支付凭证",
                        src: row.zellePaymentProof.dataUrl,
                      },
                    ]
                  : []),
                ...(row.supportPaymentProof
                  ? [
                      {
                        alt: "客服确认凭证",
                        src: row.supportPaymentProof.dataUrl,
                      },
                    ]
                  : []),
              ]}
              deleting={isUploadingProof}
              onDelete={
                row.supportPaymentProof &&
                previewIndex === (row.zellePaymentProof ? 1 : 0)
                  ? async () => {
                      if (await handleSupportProofDelete()) {
                        setPreviewIndex(null)
                      }
                    }
                  : undefined
              }
              onOpenChange={setPreviewIndex}
              openIndex={previewIndex}
            />
          </div>
        ) : null}
        <DialogFooter className="shrink-0 border-t border-border/70 pt-3">
          <Button
            className="h-8"
            onClick={() => onOpenChange(false)}
            size="sm"
            variant="outline"
          >
            取消
          </Button>
          <Button
            className="h-8"
            onClick={() =>
              onSave({
                financeNote: row?.financeNote ?? "",
                markAsOfflinePaid: confirmOfflinePayment,
                orderId: row?.orderId ?? "",
                otherCost: row?.otherCost ?? 0,
                paymentAmount: row?.paymentAmount ?? 0,
                salesMemberId: row?.salesMemberId ?? "",
                salesOwner: row?.salesOwner ?? "",
                salesOwnerSource: row?.salesMemberId ? "manual" : undefined,
              })
            }
            disabled={!row || (confirmOfflinePayment && row.paymentAmount <= 0)}
            size="sm"
          >
            <FloppyDisk size={15} />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProofPanel({
  deleting = false,
  label,
  onDelete,
  onPreview,
  proof,
  showLabel = true,
}: {
  deleting?: boolean
  label: string
  onDelete?: () => void | Promise<void>
  onPreview: () => void
  proof?: SalesDashboardRow["zellePaymentProof"]
  showLabel?: boolean
}) {
  return (
    <div>
      {showLabel ? (
        <div className="text-xs text-muted-foreground">{label}</div>
      ) : null}
      {proof ? (
        <div className="relative mt-1">
          <button
            className="flex w-full items-center gap-2 rounded-md border border-border p-1.5 pr-10 text-left text-xs hover:bg-muted"
            onClick={onPreview}
            type="button"
          >
            <img
              alt={`${label}预览`}
              className="size-14 shrink-0 rounded-sm bg-muted object-cover"
              src={proof.dataUrl}
            />
            <span className="min-w-0">
              <span className="block truncate font-medium">{label}</span>
              <span className="mt-0.5 block truncate text-muted-foreground">
                点击查看大图
              </span>
            </span>
          </button>
          {onDelete ? (
            <Button
              aria-label={`删除${label}`}
              className="absolute top-1/2 right-1 -translate-y-1/2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={deleting}
              onClick={() => void onDelete()}
              size="icon-sm"
              title={`删除${label}`}
              type="button"
              variant="ghost"
            >
              <Trash size={18} weight="bold" />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-1 text-sm text-muted-foreground">尚未上传</div>
      )}
    </div>
  )
}

function InlineCost({
  onSave,
  row,
}: {
  onSave: (patch: SalesOrderFinancePatch) => Promise<void>
  row: SalesDashboardRow
}) {
  return (
    <Input
      aria-label={`${row.orderId} 其他成本`}
      className="h-7 w-24 text-xs"
      defaultValue={row.otherCost}
      key={`${row.orderId}-${row.otherCost}`}
      min="0"
      onBlur={(event) => {
        const next = Number(event.target.value)
        if (Number.isFinite(next) && next !== row.otherCost)
          void onSave({ orderId: row.orderId, otherCost: next })
      }}
      step="0.01"
      type="number"
    />
  )
}

function FormulaEditorDialog({
  formula,
  onChange,
  onOpenChange,
  onSave,
  open,
}: {
  formula: CmsFormulaTemplate | null
  onChange: (formula: CmsFormulaTemplate | null) => void
  onOpenChange: (open: boolean) => void
  onSave: (formula: CmsFormulaTemplate) => void
  open: boolean
}) {
  const [numberValue, setNumberValue] = useState(0)
  const append = (token: CmsFormulaToken) =>
    formula && onChange({ ...formula, tokens: [...formula.tokens, token] })
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl gap-3">
        <DialogHeader>
          <DialogTitle>公司利润规则</DialogTitle>
          <DialogDescription>
            全站订单统一使用这一条规则计算公司利润。
          </DialogDescription>
        </DialogHeader>
        {formula ? (
          <>
            <div className="min-h-16 rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm">
              {formula.tokens.length ? (
                formula.tokens.map((token, index) => (
                  <button
                    aria-label={`移除 ${formatFormulaTokens([token])}`}
                    className="mr-1.5 mb-1.5 inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs transition-colors hover:border-destructive/40 hover:text-destructive"
                    key={`${token.type}-${index}`}
                    onClick={() =>
                      onChange({
                        ...formula,
                        tokens: formula.tokens.filter(
                          (_item, tokenIndex) => tokenIndex !== index
                        ),
                      })
                    }
                    title="点击移除此项"
                    type="button"
                  >
                    {formatFormulaTokens([token])}
                    <X size={11} />
                  </button>
                ))
              ) : (
                <span className="text-muted-foreground">尚未添加公式内容</span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    字段
                  </span>
                  <Button
                    className="h-7 text-xs"
                    onClick={() =>
                      onChange({
                        ...formula,
                        tokens: createDefaultProfitTokens(),
                      })
                    }
                    size="sm"
                    variant="ghost"
                  >
                    <Calculator size={13} />
                    恢复标准公式
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(formulaFieldLabels)
                    .filter(([value]) => value !== "paymentAmount")
                    .map(([value, label]) => (
                      <Button
                        className="h-7 text-xs"
                        key={value}
                        onClick={() =>
                          append({
                            type: "field",
                            value: value as CmsFormulaField,
                          })
                        }
                        size="sm"
                        variant="outline"
                      >
                        {label}
                      </Button>
                    ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  运算符与括号
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["+", "-", "*", "/"] as const).map((value) => (
                    <Button
                      className="size-7"
                      key={value}
                      onClick={() => append({ type: "operator", value })}
                      size="icon-sm"
                      variant="outline"
                    >
                      {value}
                    </Button>
                  ))}
                  {(["(", ")"] as const).map((value) => (
                    <Button
                      className="size-7"
                      key={value}
                      onClick={() => append({ type: "paren", value })}
                      size="icon-sm"
                      variant="outline"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <FormField
                  className="w-36 space-y-1.5"
                  label="固定数值 / 百分比"
                >
                  <NumberInput
                    className="h-8 px-2.5 text-sm"
                    onValueChange={setNumberValue}
                    value={numberValue}
                  />
                </FormField>
                <Button
                  className="h-8"
                  onClick={() => append({ type: "number", value: numberValue })}
                  size="sm"
                  variant="outline"
                >
                  添加数值
                </Button>
                <Button
                  className="h-8"
                  onClick={() =>
                    append({ type: "percent", value: numberValue })
                  }
                  size="sm"
                  variant="outline"
                >
                  添加百分比
                </Button>
              </div>
            </div>
            <DialogFooter className="justify-between sm:justify-between">
              <div className="flex gap-2">
                <Button
                  className="h-8"
                  onClick={() =>
                    onChange({
                      ...formula,
                      tokens: formula.tokens.slice(0, -1),
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  撤销一步
                </Button>
                <Button
                  className="h-8"
                  onClick={() => onChange({ ...formula, tokens: [] })}
                  size="sm"
                  variant="ghost"
                >
                  清空
                </Button>
              </div>
              <Button
                className="h-8"
                disabled={!formula.tokens.length}
                onClick={() => onSave(formula)}
                size="sm"
              >
                <FloppyDisk size={15} />
                完成
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function createDefaultProfitTokens(): CmsFormulaToken[] {
  return [
    { type: "field", value: "receivedAmount" },
    { type: "operator", value: "-" },
    { type: "field", value: "auntieSalary" },
    { type: "operator", value: "-" },
    { type: "field", value: "otherCost" },
    { type: "operator", value: "-" },
    { type: "field", value: "salesCommission" },
  ]
}

function createFilter(): SalesFilterCondition {
  return {
    field: "addTime",
    id: crypto.randomUUID(),
    operator: "after",
    value: "",
  }
}
function getDefaultOperator(
  type: "date" | "enum" | "number" | "text"
): SalesFilterOperator {
  return type === "date"
    ? "after"
    : type === "number"
      ? "gte"
      : type === "enum"
        ? "eq"
        : "contains"
}
function getFilterOptions(
  field: SalesFilterField,
  data: SalesDashboardResult | null
) {
  if (field === "orderStatus")
    return [
      { label: "待客服确认", value: "awaiting_confirmation" },
      { label: "待付款", value: "unpaid" },
      { label: "支付中", value: "pending" },
      { label: "已付款", value: "paid" },
      { label: "已取消", value: "cancelled" },
      { label: "支付失败", value: "failed" },
    ]
  const map: Partial<Record<SalesFilterField, string[]>> = {
    auntieName: data?.filterOptions.aunties,
    cleaningType: data?.filterOptions.cleaningTypes,
    region: data?.filterOptions.regions,
    salesOwner: data?.filterOptions.salesOwners,
  }
  return (map[field] ?? []).map((value) => ({ label: value, value }))
}
function formatSummaryValues(
  summaries: SalesDashboardResult["currencySummaries"],
  field: keyof SalesDashboardResult["currencySummaries"][number]
) {
  if (!summaries.length) return "-"
  return summaries
    .map(
      (item) =>
        `${item.currency} ${Number(item[field]).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
    )
    .join(" · ")
}
function formatMoney(currency: string, value: number) {
  return currency
    ? `${currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
    : "-"
}
function CompanyProfitValue({ row }: { row: SalesDashboardRow }) {
  return (
    <span className="block whitespace-nowrap">
      <span className="block">
        {formatMoney(row.currency, row.orderProfit)}
      </span>
      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
        {row.orderProfitCny === undefined
          ? "人民币汇率待获取"
          : `CNY ${row.orderProfitCny.toLocaleString("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
      </span>
    </span>
  )
}
function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" })
}
function getSalesRankingColor(salesOwner: string) {
  let hash = 2166136261
  for (const character of salesOwner) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return salesRankingColors[(hash >>> 0) % salesRankingColors.length]
}
