"use client"

import { useMemo, useState } from "react"
import {
  ClipboardText,
  Eye,
  FloppyDisk,
  LinkSimple,
  PencilSimple,
  Plus,
  Star,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  type PersistContent,
  RecordsPanel,
  TableFooterInfo,
  useAdminNoticeDialog,
  useTablePagination,
  orderServiceTypeOptions,
} from "@/components/admin/admin-shared"
import { AuntieAssignmentSelect } from "@/components/common/auntie-assignment-select"
import type { AdminAuntieStatsMap } from "@/lib/cms-api"
import { defaultCmsContent } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { regionsWithDerivedCities } from "@/lib/service-regions"
import {
  isPaymentOrderCompleted,
  pickAutoAssignedAuntie,
  type AuntieAssignmentMode,
} from "@/lib/auntie-assignment"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import type { CmsContent, CmsPaymentOrder } from "@/types/cms"

type OrderAdminRemotePagination = {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onQueryChange: (query: string) => void
  onStatusFilterChange: (status: string) => void
  page: number
  pageSize: number
  query: string
  statusFilter: string
  totalCount: number
  totalPages: number
}

const paymentStatusLabels: Record<CmsPaymentOrder["status"], string> = {
  cancelled: "已取消",
  failed: "支付失败",
  paid: "已付款",
  pending: "支付中",
  unpaid: "待付款",
}

function OrderStatusBadges({ order }: { order: CmsPaymentOrder }) {
  const isCompleted = isPaymentOrderCompleted(order)
  const hasReview = Boolean(order.review)
  const status = isCompleted ? "completed" : order.status
  const label = isCompleted ? "已完成" : paymentStatusLabels[order.status]

  return (
    <Badge className={getOrderStatusBadgeClass(status)}>
      {isCompleted && hasReview ? (
        <span className="inline-flex items-center" aria-label="已评价">
          <Star size={10} weight="fill" />
        </span>
      ) : null}
      {label}
    </Badge>
  )
}

function getOrderStatusBadgeClass(
  status: CmsPaymentOrder["status"] | "completed"
) {
  return cn(
    "gap-1 px-2 py-1 text-xs",
    status === "paid" && "bg-emerald-50 text-emerald-600",
    status === "unpaid" && "bg-amber-50 text-amber-700",
    status === "failed" && "bg-destructive/10 text-destructive",
    status === "cancelled" && "bg-muted text-muted-foreground",
    status === "pending" && "bg-blue-50 text-blue-700",
    status === "completed" && "bg-sky-50 text-sky-700"
  )
}

function PaymentLinkCell({ orderId }: { orderId: string }) {
  const link = getPaymentOrderLink(orderId)

  async function copyLink() {
    if (!link) {
      return
    }

    try {
      await navigator.clipboard.writeText(link)
      toast.success("付款链接已复制")
    } catch {
      toast.error("复制失败，请手动复制链接")
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Badge
        className="max-w-64 truncate border-blue-100 bg-blue-50 px-2.5 py-1 text-blue-700 shadow-none dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
        title={link}
        variant="secondary"
      >
        <LinkSimple size={13} weight="bold" />
        <span className="truncate">{link}</span>
      </Badge>
      <Button
        aria-label="复制付款链接"
        className="size-8 rounded-md"
        disabled={!link}
        onClick={copyLink}
        size="icon-sm"
        type="button"
        variant="navIcon"
      >
        <ClipboardText size={14} weight="bold" />
      </Button>
    </div>
  )
}

function getOrderCreatedTimestamp(order: CmsPaymentOrder) {
  const rawDate = order.createdAt || order.updatedAt || order.serviceDate
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0

  return Number.isFinite(timestamp) ? timestamp : 0
}

function formatOrderCreatedTime(order: CmsPaymentOrder) {
  const rawDate = order.createdAt || order.updatedAt || order.serviceDate
  const date = rawDate ? new Date(rawDate) : null

  if (!date || Number.isNaN(date.getTime())) {
    return "生成时间待确认"
  }

  return date.toLocaleString("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function createPaymentOrderDraft(defaultCurrency = "USD"): CmsPaymentOrder {
  const now = new Date().toISOString()

  return {
    amount: "",
    amountValue: 0,
    contact: "",
    createdAt: now,
    currency: normalizeAdminPaymentCurrency(defaultCurrency),
    customerName: "",
    gatewayStatus: "",
    note: "",
    orderId: "",
    provider: "airwallex",
    serviceAddress: "",
    serviceArea: "",
    serviceDate: "",
    serviceType: "",
    status: "unpaid",
    updatedAt: now,
    webhookEventIds: [],
  }
}

function normalizePaymentOrderDraft(order: CmsPaymentOrder): CmsPaymentOrder {
  const now = new Date().toISOString()

  return {
    ...order,
    amount: normalizeAdminPaymentAmount(order.amount),
    amountValue: parsePaymentAmount(order.amount),
    contact: order.contact.trim(),
    currency: normalizeAdminPaymentCurrency(order.currency),
    customerName: order.customerName.trim(),
    gatewayStatus: order.gatewayStatus?.trim() ?? "",
    note: order.note.trim(),
    orderId:
      order.orderId
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || createPaymentOrderId(),
    serviceAddress: (order.serviceAddress ?? "").trim(),
    serviceArea: order.serviceArea.trim(),
    serviceDate: order.serviceDate.trim(),
    serviceType: order.serviceType.trim(),
    provider: "airwallex",
    updatedAt: now,
    webhookEventIds: Array.isArray(order.webhookEventIds)
      ? order.webhookEventIds
      : [],
  }
}

function parsePaymentAmount(value: string) {
  const amount = Number(
    value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0
  )

  return Number.isFinite(amount) ? amount : 0
}

function normalizeAdminPaymentAmount(value: string) {
  const raw = value.trim()
  const hasAmount = /-?\d/.test(raw)
  const amount = parsePaymentAmount(raw)

  if (!raw || !hasAmount || !Number.isFinite(amount)) {
    return raw
  }

  return `$${amount.toFixed(2)}`
}

function normalizeAdminPaymentCurrency(value: string | undefined) {
  const currency = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")

  return currency || "USD"
}

function createPaymentOrderId() {
  const date = new Date()
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("")
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()

  return `ORD${datePart}${randomPart}`
}

function getPaymentOrderLink(orderId: string) {
  if (!orderId) {
    return ""
  }

  return `${window.location.origin}/?order=${encodeURIComponent(orderId)}`
}

export function OrderAdmin({
  auntieStats,
  content,
  isSaving,
  onDeleteOrder,
  onSaveOrder,
  onCommit,
  remotePagination,
}: {
  auntieStats?: AdminAuntieStatsMap
  content: CmsContent
  isSaving: boolean
  onDeleteOrder?: (orderId: string) => Promise<CmsContent | null>
  onSaveOrder?: (order: CmsPaymentOrder) => Promise<CmsContent | null>
  onCommit: PersistContent
  remotePagination?: OrderAdminRemotePagination
}) {
  const [editingOrder, setEditingOrder] = useState<CmsPaymentOrder | null>(null)
  const [editingAssignmentMode, setEditingAssignmentMode] =
    useState<AuntieAssignmentMode>("manual")
  const [orderError, setOrderError] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()
  const effectiveQuery = remotePagination?.query ?? query
  const effectiveStatusFilter = remotePagination?.statusFilter ?? statusFilter
  const orders = useMemo(() => {
    const currentOrders = content.paymentOrders ?? []

    if (remotePagination) {
      return currentOrders
    }

    return currentOrders.toSorted(
      (left, right) =>
        getOrderCreatedTimestamp(right) - getOrderCreatedTimestamp(left)
    )
  }, [content.paymentOrders, remotePagination])
  const filterKey = `${effectiveQuery}|${effectiveStatusFilter}`
  const filteredOrders = useMemo(() => {
    if (remotePagination) {
      return orders
    }

    return orders.filter((order) => {
      const searchable = [
        order.orderId,
        order.customerName,
        order.contact,
        order.serviceType,
        order.serviceArea,
        order.serviceAddress,
        order.amount,
        order.currency ?? "",
      ]
        .join(" ")
        .toLowerCase()
      const matchesQuery = searchable.includes(query.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [orders, query, remotePagination, statusFilter])
  const localPagination = useTablePagination(filteredOrders.length, filterKey)
  const visibleOrders = useMemo(
    () =>
      remotePagination
        ? filteredOrders
        : filteredOrders.slice(
            localPagination.startIndex,
            localPagination.endIndex
          ),
    [
      filteredOrders,
      localPagination.endIndex,
      localPagination.startIndex,
      remotePagination,
    ]
  )
  const remoteStartIndex =
    remotePagination && remotePagination.totalCount
      ? (remotePagination.page - 1) * remotePagination.pageSize
      : 0
  const pagination = remotePagination
    ? {
        endIndex: Math.min(
          remoteStartIndex + visibleOrders.length,
          remotePagination.totalCount
        ),
        page: remotePagination.page,
        pageSize: remotePagination.pageSize,
        setPage: remotePagination.onPageChange,
        setPageSize: remotePagination.onPageSizeChange,
        startIndex: remoteStartIndex,
        totalCount: remotePagination.totalCount,
        totalPages: remotePagination.totalPages,
      }
    : localPagination
  const existingEditingOrder = editingOrder
    ? (content.paymentOrders ?? []).find(
        (order) => order.orderId === editingOrder.orderId
      )
    : null
  const isEditingCompletedOrder = Boolean(
    existingEditingOrder && isPaymentOrderCompleted(existingEditingOrder)
  )
  const activeLoadByAuntieId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(auntieStats ?? {}).map(([auntieId, stats]) => [
          auntieId,
          stats.activeAssignedCount,
        ])
      ),
    [auntieStats]
  )

  function startCreateOrder() {
    setOrderError("")
    setEditingAssignmentMode("auto")
    setEditingOrder(createPaymentOrderDraft(content.paymentSettings.currency))
  }

  function startViewOrEditOrder(order: CmsPaymentOrder) {
    setOrderError("")
    setEditingAssignmentMode("manual")
    setEditingOrder(order)
  }

  function updateEditingOrder(patch: Partial<CmsPaymentOrder>) {
    if (isEditingCompletedOrder) {
      return
    }

    setEditingOrder((current) =>
      current
        ? {
            ...current,
            ...patch,
          }
        : current
    )
    setOrderError("")
  }

  async function saveOrder() {
    if (!editingOrder) {
      return
    }

    if (isEditingCompletedOrder) {
      setOrderError("已完成订单只能查看详情，不能再编辑。")
      return
    }

    let orderToSave = editingOrder

    if (editingAssignmentMode === "auto") {
      const autoAuntie = pickAutoAssignedAuntie(
        editingOrder.serviceArea,
        content.teamMembers ?? [],
        content.paymentOrders ?? [],
        activeLoadByAuntieId
      )

      if (!autoAuntie) {
        setOrderError("当前服务区域暂无可自动分配的空闲阿姨。")
        return
      }

      orderToSave = {
        ...editingOrder,
        assignedAuntieId: autoAuntie.id,
      }
    }

    const normalized = normalizePaymentOrderDraft(orderToSave)

    if (
      !normalized.orderId ||
      !normalized.customerName ||
      !normalized.serviceArea ||
      !normalized.serviceAddress ||
      !normalized.serviceType ||
      !normalized.serviceDate ||
      !normalized.amount
    ) {
      setOrderError(
        "请填写客户姓名、服务城市、详细地址、服务类型、服务日期和金额。"
      )
      return
    }

    const savedContent = onSaveOrder
      ? await onSaveOrder(normalized)
      : await saveOrderWithFullContent(normalized)

    if (savedContent) {
      setEditingOrder(null)
    }
  }

  async function saveOrderWithFullContent(orderToSave: CmsPaymentOrder) {
    const existingOrders = content.paymentOrders ?? []
    const currentOrder = existingOrders.find(
      (order) => order.orderId === orderToSave.orderId
    )

    if (currentOrder && isPaymentOrderCompleted(currentOrder)) {
      setOrderError("已完成订单只能查看详情，不能再编辑。")
      return null
    }

    const exists = existingOrders.some(
      (order) => order.orderId === orderToSave.orderId
    )
    const nextOrders = exists
      ? existingOrders.map((order) =>
          order.orderId === orderToSave.orderId ? orderToSave : order
        )
      : [orderToSave, ...existingOrders]

    return onCommit(
      (current) => ({
        ...current,
        paymentOrders: nextOrders,
      }),
      "付款订单已保存"
    )
  }

  async function deleteOrder(orderId: string) {
    if (
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除订单 ${orderId}。此操作无法撤销。`,
        title: "确认删除订单？",
      }))
    ) {
      return
    }

    if (onDeleteOrder) {
      await onDeleteOrder(orderId)
      return
    }

    await deleteOrderWithFullContent(orderId)
  }

  async function deleteOrderWithFullContent(orderId: string) {
    const currentOrder = (content.paymentOrders ?? []).find(
      (order) => order.orderId === orderId
    )

    if (currentOrder && isPaymentOrderCompleted(currentOrder)) {
      toast.error("已完成订单只能查看详情，不能删除。")
      return null
    }

    const nextOrders = (content.paymentOrders ?? []).filter(
      (order) => order.orderId !== orderId
    )

    return onCommit(
      (current) => ({
        ...current,
        paymentOrders: nextOrders,
      }),
      "付款订单已删除"
    )
  }

  return (
    <>
      {noticeDialog}
      <RecordsPanel
        action={
          <Button
            className="h-8 rounded-md"
            disabled={isSaving}
            onClick={startCreateOrder}
            size="sm"
            type="button"
          >
            <Plus size={15} weight="bold" />
            新建付款订单
          </Button>
        }
        count={pagination.totalCount}
        description="客服在这里创建订单，生成专属付款链接后直接发给客户。"
        filters={
          <OrderFilters
            onStatusFilterChange={
              remotePagination?.onStatusFilterChange ?? setStatusFilter
            }
            statusFilter={effectiveStatusFilter}
          />
        }
        query={effectiveQuery}
        searchPlaceholder="搜索订单、客户、服务..."
        setQuery={remotePagination?.onQueryChange ?? setQuery}
        showCount={false}
        title="订单管理"
      >
        {visibleOrders.length ? (
          <>
            <Table className="min-w-[980px] text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[170px]">订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>服务</TableHead>
                  <TableHead>服务日期</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>专属链接</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell>
                      <div className="font-semibold">{order.orderId}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatOrderCreatedTime(order)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <button
                          className="block max-w-44 truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                          onClick={() => startViewOrEditOrder(order)}
                          type="button"
                        >
                          {order.customerName || "未填写客户"}
                        </button>
                        <div className="mt-0.5 max-w-40 truncate text-[11px] text-muted-foreground">
                          {order.contact || "未填写联系方式"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {order.serviceType || "服务类型待确认"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {order.serviceArea || "区域待确认"}
                      </div>
                      {order.serviceAddress ? (
                        <div className="mt-0.5 max-w-56 truncate text-[11px] text-muted-foreground">
                          {order.serviceAddress}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{order.serviceDate || "待确认"}</TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {order.amount || "$0.00"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {normalizeAdminPaymentCurrency(
                          order.currency || content.paymentSettings.currency
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadges order={order} />
                    </TableCell>
                    <TableCell>
                      <PaymentLinkCell orderId={order.orderId} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {isPaymentOrderCompleted(order) ? (
                          <Button
                            aria-label="查看订单"
                            className="size-8 rounded-md"
                            onClick={() => startViewOrEditOrder(order)}
                            size="icon-sm"
                            type="button"
                            variant="navIcon"
                          >
                            <Eye size={14} weight="bold" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              aria-label="编辑订单"
                              className="size-8 rounded-md"
                              onClick={() => startViewOrEditOrder(order)}
                              size="icon-sm"
                              type="button"
                              variant="navIcon"
                            >
                              <PencilSimple size={14} weight="bold" />
                            </Button>
                            <Button
                              aria-label="删除订单"
                              className="size-8 rounded-md"
                              disabled={isSaving}
                              onClick={() => deleteOrder(order.orderId)}
                              size="icon-sm"
                              type="button"
                              variant="destructive"
                            >
                              <Trash size={14} weight="bold" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TableFooterInfo pagination={pagination} />
          </>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            暂无付款订单。点击右上角新建订单后，将生成客户专属付款链接。
          </div>
        )}
      </RecordsPanel>

      <Dialog
        onOpenChange={(open) => !open && setEditingOrder(null)}
        open={Boolean(editingOrder)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingCompletedOrder ? "订单详情" : "付款订单"}
            </DialogTitle>
            <DialogDescription>
              {isEditingCompletedOrder
                ? "该订单已完成，只能查看详情，不能再修改订单内容。"
                : "保存后把专属链接发给客户，客户打开后只看到自己的订单信息和支付按钮。"}
            </DialogDescription>
          </DialogHeader>
          {editingOrder ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="客户姓名 / 称呼" required>
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  onChange={(event) =>
                    updateEditingOrder({ customerName: event.target.value })
                  }
                  value={editingOrder.customerName}
                />
              </FormField>
              <FormField label="联系方式">
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  onChange={(event) =>
                    updateEditingOrder({ contact: event.target.value })
                  }
                  value={editingOrder.contact}
                />
              </FormField>
              <FormField label="服务城市 / 区域" required>
                <OrderServiceAreaSelect
                  disabled={isEditingCompletedOrder}
                  onChange={(serviceArea) =>
                    updateEditingOrder({ serviceArea })
                  }
                  value={editingOrder.serviceArea}
                />
              </FormField>
              <FormField label="详细地址" required>
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  onChange={(event) =>
                    updateEditingOrder({ serviceAddress: event.target.value })
                  }
                  placeholder="街道、门牌号、公寓号等"
                  value={editingOrder.serviceAddress}
                />
              </FormField>
              <FormField label="服务日期" required>
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  onChange={(event) =>
                    updateEditingOrder({ serviceDate: event.target.value })
                  }
                  type="date"
                  value={editingOrder.serviceDate}
                />
              </FormField>
              <FormField label="服务类型" required>
                <OrderServiceTypeSelect
                  disabled={isEditingCompletedOrder}
                  onChange={(serviceType) =>
                    updateEditingOrder({ serviceType })
                  }
                  value={editingOrder.serviceType}
                />
              </FormField>
              <FormField label="分配阿姨">
                <AuntieAssignmentSelect
                  assignedAuntieId={editingOrder.assignedAuntieId}
                  activeLoadByAuntieId={activeLoadByAuntieId}
                  aunties={content.teamMembers ?? []}
                  disabled={isEditingCompletedOrder}
                  mode={editingAssignmentMode}
                  onChange={(change) => {
                    setEditingAssignmentMode(change.mode)
                    updateEditingOrder({
                      assignedAuntieId: change.assignedAuntieId,
                    })
                  }}
                  orders={content.paymentOrders ?? []}
                  serviceArea={editingOrder.serviceArea}
                />
              </FormField>
              <FormField label="已确认金额" required>
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  onChange={(event) =>
                    updateEditingOrder({ amount: event.target.value })
                  }
                  placeholder="$268.00"
                  value={editingOrder.amount}
                />
              </FormField>
              <FormField label="币种">
                <PaymentCurrencySelect
                  disabled={isEditingCompletedOrder}
                  onChange={(currency) => updateEditingOrder({ currency })}
                  value={
                    editingOrder.currency || content.paymentSettings.currency
                  }
                />
              </FormField>
              <FormField className="sm:col-span-2" label="备注">
                <Textarea
                  className="min-h-24 rounded-md"
                  disabled={isEditingCompletedOrder}
                  onChange={(event) =>
                    updateEditingOrder({ note: event.target.value })
                  }
                  value={editingOrder.note}
                />
              </FormField>
              {editingOrder.review ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2 [&_h4]:text-sm [&_h4]:font-semibold">
                    <h4>服务评价</h4>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          weight={
                            i < editingOrder.review!.rating ? "fill" : "regular"
                          }
                        />
                      ))}
                      <span className="ml-1 text-xs font-medium text-muted-foreground">
                        {editingOrder.review.rating}.0
                      </span>
                    </div>
                  </div>
                  {editingOrder.review.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                      {editingOrder.review.comment}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{editingOrder.review.customerName || "客户"}</span>
                    <span>{editingOrder.review.createdAt}</span>
                  </div>
                </div>
              ) : null}
              {orderError ? (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                  {orderError}
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              className="h-8 rounded-md"
              onClick={() => setEditingOrder(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              {isEditingCompletedOrder ? "关闭" : "取消"}
            </Button>
            {isEditingCompletedOrder ? null : (
              <Button
                className="h-8 rounded-md"
                disabled={isSaving}
                onClick={saveOrder}
                size="sm"
                type="button"
              >
                <FloppyDisk size={15} weight="bold" />
                {isSaving ? "保存中..." : "保存订单"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function OrderFilters({
  onStatusFilterChange,
  statusFilter,
}: {
  onStatusFilterChange: (value: string) => void
  statusFilter: string
}) {
  return (
    <Select onValueChange={onStatusFilterChange} value={statusFilter}>
      <SelectTrigger className="h-8 w-full rounded-md px-2.5 text-xs sm:w-32">
        <SelectValue placeholder="全部状态" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="unpaid">待付款</SelectItem>
          <SelectItem value="pending">支付中</SelectItem>
          <SelectItem value="paid">已付款</SelectItem>
          <SelectItem value="cancelled">已取消</SelectItem>
          <SelectItem value="failed">支付失败</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function PaymentCurrencySelect({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean
  onChange: (value: string) => void
  value: string
}) {
  const normalizedValue = normalizeAdminPaymentCurrency(value)
  const commonCurrencies = ["USD", "HKD", "GBP", "CAD", "AUD", "SGD"]
  const hasCustomValue =
    normalizedValue && !commonCurrencies.includes(normalizedValue)

  return (
    <Select
      disabled={disabled}
      onValueChange={onChange}
      value={normalizedValue}
    >
      <SelectTrigger className="h-9 rounded-md">
        <SelectValue placeholder="选择币种" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {commonCurrencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
          {hasCustomValue ? (
            <SelectItem value={normalizedValue}>{normalizedValue}</SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function OrderServiceAreaSelect({
  disabled,
  onChange,
  triggerClassName,
  value,
}: {
  disabled?: boolean
  onChange: (value: string) => void
  triggerClassName?: string
  value: string
}) {
  const { content } = useCmsContent(["serviceLocations", "serviceRegions"])
  const serviceRegions = regionsWithDerivedCities(
    content.serviceRegions ?? defaultCmsContent.serviceRegions,
    content.serviceLocations ?? defaultCmsContent.serviceLocations
  )
  const knownValues = new Set(
    serviceRegions.flatMap((region) =>
      region.cities.map((city) => `${city} · ${region.name}`)
    )
  )
  const customValue = value && !knownValues.has(value) ? value : ""

  return (
    <Select disabled={disabled} onValueChange={onChange} value={value}>
      <SelectTrigger className={cn("h-9 rounded-md", triggerClassName)}>
        <SelectValue placeholder="选择服务城市 / 区域" />
      </SelectTrigger>
      <SelectContent>
        {serviceRegions.map((region) => (
          <SelectGroup key={region.id}>
            <SelectLabel>{region.name}</SelectLabel>
            {region.cities.map((city) => {
              const optionValue = `${city} · ${region.name}`

              return (
                <SelectItem key={`${region.id}-${city}`} value={optionValue}>
                  {city} · {region.name}
                </SelectItem>
              )
            })}
          </SelectGroup>
        ))}
        <SelectGroup>
          <SelectItem value="咨询其他城市">咨询其他城市</SelectItem>
          {customValue ? (
            <SelectItem value={customValue}>{customValue}</SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function OrderServiceTypeSelect({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean
  onChange: (value: string) => void
  value: string
}) {
  const hasCustomValue = value && !orderServiceTypeOptions.includes(value)

  return (
    <Select disabled={disabled} onValueChange={onChange} value={value}>
      <SelectTrigger className="h-9 rounded-md">
        <SelectValue placeholder="选择服务类型" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {orderServiceTypeOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
          {hasCustomValue ? (
            <SelectItem value={value}>{value}</SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
