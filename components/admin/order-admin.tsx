"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CaretDown,
  ClipboardText,
  FloppyDisk,
  MagnifyingGlass,
  Plus,
  Star,
  X,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  type PersistContent,
  useAdminNoticeDialog,
} from "@/components/admin/admin-shared"
import { SalesOrderDataPanel } from "@/components/admin/sales-dashboard-admin"
import { AuntieAssignmentSelect } from "@/components/common/auntie-assignment-select"
import {
  fetchAdminWecomCustomer,
  fetchAdminWecomCustomers,
  fetchPaymentOrder,
  type AdminAuntieStatsMap,
} from "@/lib/cms-api"
import { defaultCmsContent } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { regionsWithDerivedCities } from "@/lib/service-regions"
import {
  isPaymentOrderCompleted,
  pickAutoAssignedAuntie,
  type AuntieAssignmentMode,
} from "@/lib/auntie-assignment"
import { cn } from "@/lib/utils"
import { findSalesMemberForStudentTags } from "@/lib/sales-attribution"
import {
  createConfiguredOrderAmountBreakdown,
  createOrderAddOnSnapshot,
  formatBookingRequest,
  getBookingConfigForArea,
  isValidBookingPhone,
  mergeAddOnsIntoAmountBreakdown,
} from "@/lib/booking-config"
import { Button } from "@/components/ui/button"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  CmsBookingCatalogItem,
  CmsContent,
  CmsPaymentOrder,
  CmsPaymentOrderAmountItem,
} from "@/types/cms"
import type { WecomCustomer, WecomCustomerPage } from "@/lib/wecom-types"
import {
  cacheWecomCustomers,
  readCachedWecomCustomers,
} from "@/lib/wecom-customer-cache"

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

const paymentCurrencyOptions = [
  { label: "USD 美元", value: "USD" },
  { label: "CAD 加元", value: "CAD" },
  { label: "AUD 澳元", value: "AUD" },
  { label: "GBP 英镑", value: "GBP" },
  { label: "HKD 港币", value: "HKD" },
  { label: "SGD 新加坡元", value: "SGD" },
  { label: "EUR 欧元", value: "EUR" },
]

function getLocalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function createPaymentOrderDraft(defaultCurrency = "USD"): CmsPaymentOrder {
  const now = new Date().toISOString()

  return {
    addOnItems: [],
    addOnOther: "",
    amount: "",
    amountBreakdown: [],
    amountValue: 0,
    contact: "",
    baseAmountValue: 0,
    bathrooms: 1,
    bedrooms: 1,
    createdAt: now,
    currency: normalizeAdminPaymentCurrency(defaultCurrency),
    customerName: "",
    gatewayStatus: "",
    hasPets: false,
    note: "",
    orderId: "",
    provider: "airwallex",
    serviceAddress: "",
    serviceArea: "",
    serviceDate: "",
    serviceDurationHours: 0,
    serviceType: "",
    status: "unpaid",
    studio: false,
    updatedAt: now,
    webhookEventIds: [],
  }
}

function normalizePaymentOrderDraft(order: CmsPaymentOrder): CmsPaymentOrder {
  const now = new Date().toISOString()
  const amountBreakdown = normalizeAdminAmountBreakdown(order.amountBreakdown)
  const baseAmountValue = amountBreakdown.length
    ? sumAmountBreakdown(amountBreakdown)
    : getOrderBaseAmount(order)

  return {
    ...order,
    amount:
      order.status === "awaiting_confirmation" && baseAmountValue <= 0
        ? ""
        : normalizeAdminPaymentAmount(String(baseAmountValue)),
    amountBreakdown,
    amountValue: baseAmountValue,
    baseAmountValue,
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
    serviceDurationHours: Math.max(0, Number(order.serviceDurationHours) || 0),
    serviceType: order.serviceType.trim(),
    provider: "airwallex",
    status: order.status,
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

function getOrderBaseAmount(order: CmsPaymentOrder) {
  const storedBaseAmount = Number(order.baseAmountValue)

  if (Number.isFinite(storedBaseAmount) && storedBaseAmount >= 0) {
    return storedBaseAmount
  }

  const breakdownTotal = sumAmountBreakdown(order.amountBreakdown ?? [])

  return breakdownTotal > 0
    ? breakdownTotal
    : Math.max(0, parsePaymentAmount(order.amount))
}

function createConfiguredPricingPatch(
  currency: string,
  service: CmsBookingCatalogItem | undefined,
  serviceDurationHours: number | undefined,
  addOnItems: NonNullable<CmsPaymentOrder["addOnItems"]>
): Partial<CmsPaymentOrder> {
  const amountBreakdown = createConfiguredOrderAmountBreakdown(
    service,
    serviceDurationHours,
    addOnItems
  )
  const baseAmountValue = sumAmountBreakdown(amountBreakdown)

  return {
    amount:
      baseAmountValue > 0
        ? normalizeAdminPaymentAmount(String(baseAmountValue))
        : "",
    amountBreakdown,
    amountValue: baseAmountValue,
    baseAmountValue,
    currency,
  }
}

function normalizeAdminAmountBreakdown(
  items: CmsPaymentOrderAmountItem[] | undefined
) {
  return (items ?? [])
    .map((item) => ({
      amount: Number(Number(item.amount).toFixed(2)),
      label: item.label.trim().slice(0, 80),
    }))
    .filter(
      (item) => item.label && Number.isFinite(item.amount) && item.amount >= 0
    )
    .slice(0, 20)
}

function sumAmountBreakdown(items: CmsPaymentOrderAmountItem[]) {
  return Number(
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)
  )
}

function formatAdminCurrencyAmount(amount: number, currency: string) {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0

  return `${normalizeAdminPaymentCurrency(currency)} ${normalizedAmount.toFixed(2)}`
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

export function OrderAdmin({
  auntieStats,
  content,
  isSaving,
  onDeleteOrder,
  onSaveOrder,
  onCommit,
  remotePagination,
  token,
}: {
  auntieStats?: AdminAuntieStatsMap
  content: CmsContent
  isSaving: boolean
  onDeleteOrder?: (orderId: string) => Promise<CmsContent | null>
  onSaveOrder?: (order: CmsPaymentOrder) => Promise<CmsContent | null>
  onCommit: PersistContent
  remotePagination?: OrderAdminRemotePagination
  token: string
}) {
  const [editingOrder, setEditingOrder] = useState<CmsPaymentOrder | null>(null)
  const [editingAssignmentMode, setEditingAssignmentMode] =
    useState<AuntieAssignmentMode>("manual")
  const [orderError, setOrderError] = useState("")
  void remotePagination
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()
  const existingEditingOrder = editingOrder
    ? ((content.paymentOrders ?? []).find(
        (order) => order.orderId === editingOrder.orderId
      ) ?? (editingOrder.orderId ? editingOrder : null))
    : null
  const isEditingCompletedOrder = Boolean(
    existingEditingOrder && isPaymentOrderCompleted(existingEditingOrder)
  )
  const isCreatingBooking = Boolean(
    editingOrder &&
    !existingEditingOrder &&
    editingOrder.status === "awaiting_confirmation"
  )
  const shouldUseConfiguredPricing = Boolean(
    !existingEditingOrder ||
    (existingEditingOrder.status === "awaiting_confirmation" &&
      getOrderBaseAmount(existingEditingOrder) <= 0)
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
  const editingBookingConfig = editingOrder
    ? getBookingConfigForArea(
        content.bookingConfigs,
        content.serviceLocations,
        editingOrder.serviceArea
      )
    : undefined
  const configuredServiceItems = (editingBookingConfig?.items ?? []).filter(
    (item) => item.type === "service" && item.enabled
  )
  const editingServiceItems =
    editingOrder?.serviceType &&
    !configuredServiceItems.some(
      (item) =>
        item.id === editingOrder.serviceTypeId ||
        item.label === editingOrder.serviceType
    )
      ? [
          ...configuredServiceItems,
          {
            basePrice: 0,
            description: "历史订单服务类型",
            enabled: true,
            id: editingOrder.serviceTypeId || editingOrder.serviceType,
            label: editingOrder.serviceType,
            quoteRequired: true,
            type: "service" as const,
          },
        ]
      : configuredServiceItems
  const editingAddOnItems = (editingBookingConfig?.items ?? []).filter(
    (item) => item.type === "addon" && item.enabled
  )
  const editingLocation = content.serviceLocations.find(
    (item) => `${item.city} · ${item.country}` === editingOrder?.serviceArea
  )
  const editingCountryCode = content.serviceRegions.find(
    (item) => item.name === editingLocation?.country
  )?.code2

  function startCreateOrder() {
    setOrderError("")
    setEditingAssignmentMode("manual")
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

  async function copyBookingInfo(order: CmsPaymentOrder) {
    try {
      await navigator.clipboard.writeText(formatBookingRequest(order))
      toast.success("预约信息已复制")
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  async function loadOrder(orderId: string) {
    try {
      const order = await fetchPaymentOrder(orderId)
      startViewOrEditOrder(order)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "订单加载失败")
    }
  }

  async function copyBookingInfoById(orderId: string) {
    try {
      const order = await fetchPaymentOrder(orderId)
      await copyBookingInfo(order)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "订单加载失败")
    }
  }

  async function saveOrder() {
    if (!editingOrder) {
      return
    }

    if (isEditingCompletedOrder) {
      setOrderError("已完成订单只能查看详情，不能再编辑。")
      return
    }

    const selectedService = editingServiceItems.find(
      (item) => item.id === editingOrder.serviceTypeId
    )
    const addOnItems = createOrderAddOnSnapshot(
      editingBookingConfig,
      (editingOrder.addOnItems ?? []).map((item) => item.id)
    )
    let orderToSave: CmsPaymentOrder = {
      ...editingOrder,
      addOnItems,
      amountBreakdown: mergeAddOnsIntoAmountBreakdown(
        editingOrder.amountBreakdown,
        addOnItems,
        getOrderBaseAmount(editingOrder)
      ),
      serviceType: selectedService?.label ?? editingOrder.serviceType,
    }
    if (
      existingEditingOrder?.status === "awaiting_confirmation" &&
      getOrderBaseAmount(orderToSave) > 0
    ) {
      orderToSave = { ...orderToSave, status: "unpaid" }
    }

    if (
      editingAssignmentMode === "auto" &&
      editingOrder.status !== "awaiting_confirmation"
    ) {
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
        ...orderToSave,
        assignedAuntieId: autoAuntie.id,
      }
    }

    const normalized = normalizePaymentOrderDraft(orderToSave)
    const assignedAuntie = content.teamMembers.find(
      (member) => member.id === normalized.assignedAuntieId
    )

    if (
      assignedAuntie?.salaryMode === "hourly" &&
      Number(normalized.serviceDurationHours) <= 0
    ) {
      setOrderError("所选阿姨按时薪计算，请填写大于 0 的服务时长。")
      return
    }

    if (
      selectedService &&
      !selectedService.quoteRequired &&
      Number(selectedService.basePrice) > 0 &&
      Number(normalized.serviceDurationHours) <= 0
    ) {
      setOrderError("该服务按小时计费，请填写大于 0 的服务时长。")
      return
    }

    if (
      !normalized.orderId ||
      !normalized.customerName ||
      !normalized.serviceArea ||
      !normalized.serviceAddress ||
      !normalized.serviceType ||
      !normalized.serviceDate ||
      (isCreatingBooking && normalized.serviceDate < getLocalDateKey()) ||
      !isValidBookingPhone(normalized.contact, editingCountryCode) ||
      (!normalized.studio && Number(normalized.bedrooms) < 1) ||
      Number(normalized.bathrooms) < 1 ||
      (normalized.status !== "awaiting_confirmation" &&
        (!normalized.amount || Number(normalized.amountValue) <= 0))
    ) {
      setOrderError(
        "请填写客户姓名、当地联系电话、服务城市、房型、详细地址、清洁需求和服务日期。待客服确认的预约单无需填写金额。"
      )
      return
    }

    if (
      normalized.status !== "awaiting_confirmation" &&
      !existingEditingOrder &&
      !normalized.amountBreakdown?.length
    ) {
      setOrderError("请至少添加一项订单金额明细。")
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
    const currentOrder = (content.paymentOrders ?? []).find(
      (order) => order.orderId === orderId
    )

    if (currentOrder && isPaymentOrderCompleted(currentOrder)) {
      toast.error("已完成订单只能查看详情，不能删除。")
      return
    }

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
      <SalesOrderDataPanel
        isSaving={isSaving}
        onCopyOrder={copyBookingInfoById}
        onCreateOrder={startCreateOrder}
        onDeleteOrder={async (orderId) => {
          await deleteOrder(orderId)
        }}
        onOpenOrder={loadOrder}
        refreshKey={content.updatedAt}
        token={token}
      />
      <Dialog
        onOpenChange={(open) => !open && setEditingOrder(null)}
        open={Boolean(editingOrder)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingCompletedOrder ? "订单详情" : "订单确认"}
            </DialogTitle>
            <DialogDescription>
              {isEditingCompletedOrder
                ? "该订单已完成，只能查看详情，不能再修改订单内容。"
                : editingOrder?.status === "awaiting_confirmation"
                  ? editingOrder.orderId
                    ? "可直接修改预约信息；填写金额明细后保存，订单会转为待付款并生成专属付款链接。"
                    : "填写与客户前台一致的预约信息。保存后生成预约编号，无需填写金额或分配阿姨。"
                  : "保存后把专属链接发给客户，客户打开后只看到自己的订单信息和支付按钮。"}
            </DialogDescription>
          </DialogHeader>
          {editingOrder ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="选择用户">
                <OrderCustomerSelect
                  customerName={editingOrder.customerName}
                  customerRelationId={editingOrder.customerRelationId}
                  disabled={isEditingCompletedOrder}
                  onSelect={(customer) => {
                    const salesMember = findSalesMemberForStudentTags(
                      customer.studentType,
                      content.salesMembers
                    )
                    updateEditingOrder({
                      contact:
                        editingOrder.contact ||
                        customer.remarkMobiles.split(/[,，]/)[0]?.trim() ||
                        "",
                      customerRelationId: customer.relationId,
                      customerType:
                        customer.nameAndType.split("@").at(-1)?.trim() ?? "",
                      customerName: customer.nameAndType.split("@")[0].trim(),
                      salesMemberId: salesMember?.id,
                      salesOwner: salesMember?.name ?? "",
                      salesOwnerSource: salesMember ? "wecom_tag" : undefined,
                    })
                  }}
                  token={token}
                />
              </FormField>
              <FormField label="客户姓名 / 称呼" required>
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  min={isCreatingBooking ? getLocalDateKey() : undefined}
                  onChange={(event) =>
                    updateEditingOrder({ customerName: event.target.value })
                  }
                  value={editingOrder.customerName}
                />
              </FormField>
              <FormField label="联系电话" required>
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  onChange={(event) =>
                    updateEditingOrder({ contact: event.target.value })
                  }
                  type="tel"
                  value={editingOrder.contact}
                />
              </FormField>
              <FormField label="服务城市 / 区域" required>
                <OrderServiceAreaSelect
                  disabled={isEditingCompletedOrder}
                  onChange={(serviceArea) =>
                    (() => {
                      const config = getBookingConfigForArea(
                        content.bookingConfigs,
                        content.serviceLocations,
                        serviceArea
                      )
                      updateEditingOrder({
                        addOnItems: [],
                        addOnOther: "",
                        amount: "",
                        amountBreakdown: [],
                        amountValue: 0,
                        baseAmountValue: 0,
                        currency: config?.currency ?? editingOrder.currency,
                        serviceArea,
                        serviceType: "",
                        serviceTypeId: "",
                      })
                    })()
                  }
                  value={editingOrder.serviceArea}
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
              <FormField label="服务时长（小时）">
                <NumberInput
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  min="0"
                  onValueChange={(serviceDurationHours) =>
                    updateEditingOrder({
                      ...(shouldUseConfiguredPricing
                        ? createConfiguredPricingPatch(
                            editingBookingConfig?.currency ??
                              editingOrder.currency ??
                              "USD",
                            editingServiceItems.find(
                              (item) => item.id === editingOrder.serviceTypeId
                            ),
                            serviceDurationHours,
                            editingOrder.addOnItems ?? []
                          )
                        : {}),
                      serviceDurationHours,
                    })
                  }
                  placeholder="例如 4"
                  step="0.25"
                  value={editingOrder.serviceDurationHours ?? 0}
                />
              </FormField>
              <FormField label="服务类型" required>
                <OrderServiceTypeSelect
                  currency={
                    editingBookingConfig?.currency ??
                    editingOrder.currency ??
                    "USD"
                  }
                  disabled={isEditingCompletedOrder}
                  items={editingServiceItems}
                  onChange={(serviceTypeId) => {
                    const service = editingServiceItems.find(
                      (item) => item.id === serviceTypeId
                    )
                    updateEditingOrder({
                      ...(shouldUseConfiguredPricing
                        ? createConfiguredPricingPatch(
                            editingBookingConfig?.currency ??
                              editingOrder.currency ??
                              "USD",
                            service,
                            editingOrder.serviceDurationHours,
                            editingOrder.addOnItems ?? []
                          )
                        : {}),
                      serviceType: service?.label ?? "",
                      serviceTypeId,
                    })
                  }}
                  value={editingOrder.serviceTypeId || editingOrder.serviceType}
                />
              </FormField>
              <FormField className="sm:col-span-2" label="详细地址" required>
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
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm">
                  <Checkbox
                    checked={Boolean(editingOrder.studio)}
                    disabled={isEditingCompletedOrder}
                    onCheckedChange={(checked) =>
                      updateEditingOrder({
                        bedrooms: checked === true ? 0 : 1,
                        studio: checked === true,
                      })
                    }
                  />
                  Studio（开间，无独立卧室）
                </label>
                <AdminAddOnSelector
                  currency={
                    editingBookingConfig?.currency ??
                    editingOrder.currency ??
                    "USD"
                  }
                  disabled={isEditingCompletedOrder}
                  items={editingAddOnItems}
                  onChange={(addOnItems) =>
                    updateEditingOrder({
                      addOnItems,
                      ...(shouldUseConfiguredPricing
                        ? createConfiguredPricingPatch(
                            editingBookingConfig?.currency ??
                              editingOrder.currency ??
                              "USD",
                            editingServiceItems.find(
                              (item) => item.id === editingOrder.serviceTypeId
                            ),
                            editingOrder.serviceDurationHours,
                            addOnItems
                          )
                        : {}),
                    })
                  }
                  onOtherChange={(addOnOther) =>
                    updateEditingOrder({ addOnOther })
                  }
                  other={editingOrder.addOnOther ?? ""}
                  selected={editingOrder.addOnItems ?? []}
                />
              </div>
              {!editingOrder.studio ? (
                <FormField label="卧室数量" required>
                  <Input
                    className="h-9 rounded-md"
                    disabled={isEditingCompletedOrder}
                    min="1"
                    onChange={(event) =>
                      updateEditingOrder({
                        bedrooms: Number(event.target.value),
                      })
                    }
                    step="1"
                    type="number"
                    value={editingOrder.bedrooms ?? 1}
                  />
                </FormField>
              ) : null}
              <FormField label="卫生间数量" required>
                <Input
                  className="h-9 rounded-md"
                  disabled={isEditingCompletedOrder}
                  min="1"
                  onChange={(event) =>
                    updateEditingOrder({
                      bathrooms: Number(event.target.value),
                    })
                  }
                  step="1"
                  type="number"
                  value={editingOrder.bathrooms ?? 1}
                />
              </FormField>
              <FormField label="宠物情况">
                <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm">
                  <Checkbox
                    checked={Boolean(editingOrder.hasPets)}
                    disabled={isEditingCompletedOrder}
                    onCheckedChange={(checked) =>
                      updateEditingOrder({ hasPets: checked === true })
                    }
                  />
                  是否有宠物
                </label>
              </FormField>
              {!isCreatingBooking ? (
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
              ) : null}
              {!isCreatingBooking ? (
                <FormField label="订单金额明细" required>
                  <OrderAmountBreakdownEditor
                    currency={
                      editingOrder.currency || content.paymentSettings.currency
                    }
                    disabled={
                      isEditingCompletedOrder ||
                      Boolean(editingOrder.airwallexPaymentIntentId)
                    }
                    fallbackAmount={getOrderBaseAmount(editingOrder)}
                    items={mergeAddOnsIntoAmountBreakdown(
                      editingOrder.amountBreakdown,
                      editingOrder.addOnItems,
                      getOrderBaseAmount(editingOrder)
                    )}
                    onChange={(amountBreakdown, baseAmountValue) =>
                      updateEditingOrder({
                        amount: normalizeAdminPaymentAmount(
                          String(baseAmountValue)
                        ),
                        amountBreakdown,
                        amountValue: baseAmountValue,
                        baseAmountValue,
                      })
                    }
                  />
                </FormField>
              ) : null}
              {!isCreatingBooking ? (
                <FormField label="币种">
                  <PaymentCurrencySelect
                    disabled={isEditingCompletedOrder}
                    onChange={(currency) => updateEditingOrder({ currency })}
                    value={
                      editingOrder.currency || content.paymentSettings.currency
                    }
                  />
                </FormField>
              ) : null}
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
            {editingOrder?.orderId ? (
              <Button
                className="h-8 rounded-md"
                onClick={() => copyBookingInfo(editingOrder)}
                size="sm"
                type="button"
                variant="outline"
              >
                <ClipboardText size={15} weight="bold" />
                复制预约信息
              </Button>
            ) : null}
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

export function OrderCustomerSelect({
  customerName,
  customerRelationId,
  disabled,
  onSelect,
  token,
}: {
  customerName?: string
  customerRelationId?: string
  disabled?: boolean
  onSelect: (customer: WecomCustomer) => void
  token: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [customers, setCustomers] = useState<WecomCustomer[]>([])
  const [selectedCustomer, setSelectedCustomer] =
    useState<WecomCustomer | null>(null)
  const [pagination, setPagination] =
    useState<WecomCustomerPage["pagination"]>()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const relationId = customerRelationId?.trim() ?? ""
    if (!relationId) return

    let isMounted = true
    fetchAdminWecomCustomer(token, relationId)
      .then(({ customer }) => {
        if (!isMounted) return
        setSelectedCustomer(customer)
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [customerRelationId, token])

  useEffect(() => {
    if (!open) return
    const cached = readCachedWecomCustomers(token, query)
    let isMounted = true
    const timer = window.setTimeout(
      async () => {
        if (cached) {
          setCustomers(cached.customers)
          setPagination(cached.pagination)
          setError("")
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        setError("")
        try {
          const result = await fetchAdminWecomCustomers(token, {
            page: 1,
            pageSize: 20,
            query,
          })
          if (!isMounted) return
          setCustomers(result.customers)
          setPagination(result.pagination)
          cacheWecomCustomers(token, query, result.customers, result.pagination)
        } catch (loadError) {
          if (isMounted) {
            setError(
              loadError instanceof Error ? loadError.message : "用户加载失败"
            )
          }
        } finally {
          if (isMounted) setIsLoading(false)
        }
      },
      cached ? 0 : 250
    )
    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [open, query, token])

  async function loadMore() {
    if (
      isLoading ||
      isLoadingMore ||
      !pagination ||
      pagination.page >= pagination.totalPages
    ) {
      return
    }
    setIsLoadingMore(true)
    try {
      const result = await fetchAdminWecomCustomers(token, {
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
        query,
      })
      const mergedCustomers = mergeCustomers(customers, result.customers)
      setCustomers(mergedCustomers)
      setPagination(result.pagination)
      cacheWecomCustomers(token, query, mergedCustomers, result.pagination)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "更多用户加载失败"
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  const displayedCustomer =
    selectedCustomer?.relationId === customerRelationId
      ? selectedCustomer
      : null

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="h-9 w-full justify-between rounded-md px-3 font-normal"
          disabled={disabled}
          type="button"
          variant="outline"
        >
          <span className="truncate text-muted-foreground">
            {displayedCustomer ? (
              <span className="flex min-w-0 items-center gap-2 text-foreground">
                <CustomerAvatar customer={displayedCustomer} />
                <span className="truncate">
                  {displayedCustomer.nameAndType}
                </span>
              </span>
            ) : customerRelationId ? (
              <span className="truncate text-foreground">
                {customerName || customerRelationId}
              </span>
            ) : open ? (
              "选择企业微信客户"
            ) : (
              "选择已有客户（可选）"
            )}
          </span>
          <CaretDown className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(32rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            className="h-10 rounded-none border-0 px-0 shadow-none focus-visible:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名、企业、地区或添加人"
            value={query}
          />
        </div>
        <div
          className="max-h-64 [touch-action:pan-y] overflow-y-scroll overscroll-contain p-1"
          onScroll={(event) => {
            const element = event.currentTarget
            if (
              element.scrollHeight - element.scrollTop - element.clientHeight <
              48
            ) {
              void loadMore()
            }
          }}
          onWheel={(event) => {
            const element = event.currentTarget
            if (element.scrollHeight <= element.clientHeight) return
            event.preventDefault()
            event.stopPropagation()
            element.scrollTop += event.deltaY
          }}
        >
          {isLoading ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              正在加载用户...
            </div>
          ) : error ? (
            <div className="px-3 py-8 text-center text-sm text-destructive">
              {error}
            </div>
          ) : customers.length ? (
            customers.map((customer) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                key={customer.relationId}
                onClick={() => {
                  onSelect(customer)
                  setSelectedCustomer(customer)
                  setOpen(false)
                }}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CustomerAvatar customer={customer} />
                  <span className="truncate font-medium">
                    {customer.nameAndType}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {customer.followUserId}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              暂无匹配用户
            </div>
          )}
          {isLoadingMore ? (
            <div className="px-3 py-2 text-center text-xs text-muted-foreground">
              正在加载更多...
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function mergeCustomers(current: WecomCustomer[], incoming: WecomCustomer[]) {
  const customers = new Map(
    current.map((customer) => [customer.relationId, customer])
  )
  incoming.forEach((customer) => customers.set(customer.relationId, customer))
  return Array.from(customers.values())
}

function CustomerAvatar({ customer }: { customer: WecomCustomer }) {
  return customer.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element -- WeCom supplies remote avatar URLs.
    <img
      alt=""
      className="size-6 shrink-0 rounded-full bg-muted object-cover"
      loading="lazy"
      src={customer.avatar}
    />
  ) : (
    <span className="size-6 shrink-0 rounded-full bg-muted" />
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
  const hasCustomValue = !paymentCurrencyOptions.some(
    (option) => option.value === normalizedValue
  )

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
          {paymentCurrencyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
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

function OrderAmountBreakdownEditor({
  currency,
  disabled,
  fallbackAmount,
  items,
  onChange,
}: {
  currency: string
  disabled: boolean
  fallbackAmount: number
  items: CmsPaymentOrderAmountItem[]
  onChange: (
    items: CmsPaymentOrderAmountItem[],
    baseAmountValue: number
  ) => void
}) {
  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState("")
  const total = sumAmountBreakdown(items)

  function updateItems(nextItems: CmsPaymentOrderAmountItem[]) {
    const normalizedItems = normalizeAdminAmountBreakdown(nextItems)

    onChange(normalizedItems, sumAmountBreakdown(normalizedItems))
  }

  function addItem() {
    const nextAmount = Number(amount)
    const nextLabel = label.trim()

    if (!nextLabel || !Number.isFinite(nextAmount) || nextAmount <= 0) {
      return
    }

    const initialItems =
      items.length === 0 && fallbackAmount > 0
        ? [{ amount: fallbackAmount, label: "基础费用" }]
        : items

    updateItems([...initialItems, { amount: nextAmount, label: nextLabel }])
    setLabel("")
    setAmount("")
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-9 w-full justify-between rounded-md px-3 text-left"
          disabled={disabled}
          type="button"
          variant="outline"
        >
          <span className="truncate">
            {items.length ? `${items.length} 项明细` : "添加金额组成"}
          </span>
          <span className="shrink-0 font-semibold text-foreground">
            {formatAdminCurrencyAmount(total || fallbackAmount, currency)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(26rem,calc(100vw-2rem))]">
        <div className="text-sm font-semibold text-foreground">
          订单金额明细
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          逐项录入费用，合计将自动作为订单确认金额。
        </p>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_6rem_auto] gap-2">
          <Input
            className="h-8 rounded-md text-xs"
            disabled={disabled}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="例如：地毯清理"
            value={label}
          />
          <Input
            className="h-8 rounded-md text-xs"
            disabled={disabled}
            inputMode="decimal"
            min="0.01"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="50"
            step="0.01"
            type="number"
            value={amount}
          />
          <Button
            aria-label="添加金额项"
            className="size-8 rounded-md"
            disabled={disabled || !label.trim() || Number(amount) <= 0}
            onClick={addItem}
            size="icon-sm"
            type="button"
          >
            <Plus size={15} weight="bold" />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.length ? (
            items.map((item, index) => (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground"
                key={`${item.label}-${index}`}
              >
                {item.label} {formatAdminCurrencyAmount(item.amount, currency)}
                <button
                  aria-label={`删除${item.label}`}
                  className="text-muted-foreground transition hover:text-foreground"
                  disabled={disabled}
                  onClick={() =>
                    updateItems(
                      items.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  type="button"
                >
                  <X size={13} weight="bold" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              尚未添加金额项
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">订单金额合计</span>
          <span className="font-semibold text-foreground">
            {formatAdminCurrencyAmount(total || fallbackAmount, currency)}
          </span>
        </div>
      </PopoverContent>
    </Popover>
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
  currency,
  disabled,
  items,
  onChange,
  value,
}: {
  currency: string
  disabled?: boolean
  items: CmsBookingCatalogItem[]
  onChange: (value: string) => void
  value: string
}) {
  return (
    <Select disabled={disabled} onValueChange={onChange} value={value}>
      <SelectTrigger className="h-9 rounded-md">
        <SelectValue placeholder="选择服务类型" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label} ·{" "}
              {option.quoteRequired
                ? "客服确认"
                : `${currency} ${option.basePrice.toFixed(2)}/小时`}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function AdminAddOnSelector({
  currency,
  disabled,
  items,
  onChange,
  onOtherChange,
  other,
  selected,
}: {
  currency: string
  disabled?: boolean
  items: CmsBookingCatalogItem[]
  onChange: (items: NonNullable<CmsPaymentOrder["addOnItems"]>) => void
  onOtherChange: (value: string) => void
  other: string
  selected: NonNullable<CmsPaymentOrder["addOnItems"]>
}) {
  const selectedIds = new Set(selected.map((item) => item.id))
  const hasOther = items.some(
    (item) =>
      selectedIds.has(item.id) &&
      (item.id.includes("other") || item.label.includes("其他"))
  )

  function toggle(item: CmsBookingCatalogItem, checked: boolean) {
    onChange(
      checked
        ? [
            ...selected.filter((entry) => entry.id !== item.id),
            {
              id: item.id,
              label: item.label,
              price: item.basePrice,
              quoteRequired: item.quoteRequired === true,
            },
          ]
        : selected.filter((entry) => entry.id !== item.id)
    )
  }

  return (
    <div className="min-w-0 space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="h-9 w-full justify-between rounded-md"
            disabled={disabled}
            type="button"
            variant="outline"
          >
            <span className="truncate">
              {selected.length
                ? selected.map((item) => item.label).join("、")
                : "选择附加项目"}
            </span>
            <CaretDown size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(28rem,calc(100vw-2rem))] p-2"
          align="start"
        >
          <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain">
            {items.map((item) => (
              <label
                className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted"
                key={item.id}
              >
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={(checked) => toggle(item, checked === true)}
                />
                <span className="min-w-0 flex-1 text-xs">
                  <span className="flex justify-between gap-2 font-medium">
                    <span>{item.label}</span>
                    <span className="shrink-0 text-primary">
                      {item.quoteRequired
                        ? "客服确认"
                        : `${currency} ${item.basePrice.toFixed(2)}/次`}
                    </span>
                  </span>
                  {item.description ? (
                    <span className="mt-0.5 block text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
            {!items.length ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                当前地区暂无附加项目
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {hasOther ? (
        <Input
          className="h-9 rounded-md"
          disabled={disabled}
          onChange={(event) => onOtherChange(event.target.value)}
          placeholder="其他附加项目说明"
          value={other}
        />
      ) : null}
    </div>
  )
}
