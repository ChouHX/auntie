"use client"

import { useState } from "react"
import { FloppyDisk, PencilSimple, Plus, Trash } from "@phosphor-icons/react"

import { type PersistContent, createId } from "@/components/admin/admin-shared"
import { Badge } from "@/components/ui/badge"
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
import type {
  CmsBookingCatalogItem,
  CmsBookingLocationConfig,
  CmsContent,
} from "@/types/cms"

const currencyOptions = [
  "USD",
  "CAD",
  "AUD",
  "GBP",
  "EUR",
  "SGD",
  "HKD",
  "JPY",
  "KRW",
  "MYR",
  "NZD",
]

function createItem(
  type: CmsBookingCatalogItem["type"]
): CmsBookingCatalogItem {
  return {
    basePrice: 0,
    description: "",
    enabled: true,
    id: createId(type),
    label: "",
    quoteRequired: false,
    type,
  }
}

export function BookingConfigAdmin({
  content,
  isSaving,
  onCommit,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
}) {
  const locations = content.serviceLocations ?? []
  const initialLocationId = locations[0]?.id ?? ""
  const [locationId, setLocationId] = useState(initialLocationId)
  const [draft, setDraft] = useState<CmsBookingLocationConfig>(
    () =>
      content.bookingConfigs?.find(
        (item) => item.locationId === initialLocationId
      ) ?? { currency: "USD", items: [], locationId: initialLocationId }
  )
  const [editingItem, setEditingItem] = useState<CmsBookingCatalogItem | null>(
    null
  )

  const selectedLocation = locations.find((item) => item.id === locationId)

  function saveItem() {
    if (!editingItem?.label.trim()) return
    const normalized = normalizeItem(editingItem)
    setDraft((current) => ({
      ...current,
      items: current.items.some((item) => item.id === normalized.id)
        ? current.items.map((item) =>
            item.id === normalized.id ? normalized : item
          )
        : [...current.items, normalized],
    }))
    setEditingItem(null)
  }

  async function saveConfig() {
    const nextConfig = { ...draft, locationId }
    await onCommit(
      (current) => ({
        ...current,
        bookingConfigs: current.bookingConfigs.some(
          (item) => item.locationId === locationId
        )
          ? current.bookingConfigs.map((item) =>
              item.locationId === locationId ? nextConfig : item
            )
          : [...current.bookingConfigs, nextConfig],
      }),
      "预约项目配置已保存"
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-end">
        <FormField className="min-w-0 flex-1 space-y-1.5" label="配置城市">
          <Select
            onValueChange={(nextLocationId) => {
              setLocationId(nextLocationId)
              setDraft(
                content.bookingConfigs.find(
                  (item) => item.locationId === nextLocationId
                ) ?? {
                  currency: "USD",
                  items: [],
                  locationId: nextLocationId,
                }
              )
            }}
            value={locationId}
          >
            <SelectTrigger className="h-8 rounded-md">
              <SelectValue placeholder="选择城市" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.city} · {location.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField className="w-full space-y-1.5 sm:w-36" label="币种">
          <Select
            onValueChange={(currency) =>
              setDraft((current) => ({ ...current, currency }))
            }
            value={draft.currency}
          >
            <SelectTrigger className="h-8 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <Button
          className="h-8 rounded-md"
          disabled={isSaving || !locationId}
          onClick={saveConfig}
          size="sm"
        >
          <FloppyDisk size={15} weight="bold" />
          保存配置
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <div>
            <h3 className="text-sm font-semibold">
              {selectedLocation?.city ?? "城市"}预约项目
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              配置用于前台参考价和后台订单自动计价，最终费用仍由客服确认。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="h-8 rounded-md"
              onClick={() => setEditingItem(createItem("addon"))}
              size="sm"
              variant="outline"
            >
              <Plus size={14} />
              附加项目
            </Button>
            <Button
              className="h-8 rounded-md"
              onClick={() => setEditingItem(createItem("service"))}
              size="sm"
            >
              <Plus size={14} />
              清洁需求
            </Button>
          </div>
        </div>
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-24">类型</TableHead>
              <TableHead>项目</TableHead>
              <TableHead>服务说明</TableHead>
              <TableHead className="w-36">计价标准</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge
                    variant={item.type === "service" ? "default" : "secondary"}
                  >
                    {item.type === "service" ? "清洁需求" : "附加项目"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="max-w-80 truncate text-xs text-muted-foreground">
                  {item.description || "—"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.quoteRequired
                    ? "客服确认"
                    : `${draft.currency} ${item.basePrice.toFixed(2)} / ${item.type === "service" ? "小时" : "次"}`}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.enabled ? "启用" : "停用"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      aria-label="编辑"
                      className="size-8"
                      onClick={() => setEditingItem({ ...item })}
                      size="icon-sm"
                      variant="navIcon"
                    >
                      <PencilSimple size={14} />
                    </Button>
                    <Button
                      aria-label="删除"
                      className="size-8"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          items: current.items.filter(
                            (entry) => entry.id !== item.id
                          ),
                        }))
                      }
                      size="icon-sm"
                      variant="destructive"
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!draft.items.length ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            暂无项目，请新增清洁需求或附加项目。
          </div>
        ) : null}
      </div>

      <BookingItemDialog
        item={editingItem}
        onChange={setEditingItem}
        onSave={saveItem}
      />
    </div>
  )
}

function BookingItemDialog({
  item,
  onChange,
  onSave,
}: {
  item: CmsBookingCatalogItem | null
  onChange: (item: CmsBookingCatalogItem | null) => void
  onSave: () => void
}) {
  const update = (patch: Partial<CmsBookingCatalogItem>) =>
    item && onChange({ ...item, ...patch })
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => !open && onChange(null)}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item?.type === "addon" ? "附加项目" : "清洁需求"}
          </DialogTitle>
          <DialogDescription>
            清洁需求按小时计费，附加项目按次计费。
          </DialogDescription>
        </DialogHeader>
        {item ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="项目类型">
              <Select
                onValueChange={(type: "addon" | "service") => update({ type })}
                value={item.type}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">清洁需求</SelectItem>
                  <SelectItem value="addon">附加项目</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="项目名称" required>
              <Input
                className="h-9"
                onChange={(event) => update({ label: event.target.value })}
                value={item.label}
              />
            </FormField>
            <FormField className="sm:col-span-2" label="服务内容 / 说明">
              <Textarea
                className="min-h-20"
                onChange={(event) =>
                  update({ description: event.target.value })
                }
                value={item.description}
              />
            </FormField>
            <FormField
              description={
                item.type === "service"
                  ? "订单金额将按每小时单价乘以服务时长计算。"
                  : "客户每选择一次该附加项目，收取一次费用。"
              }
              label={item.type === "service" ? "每小时价格" : "每次价格"}
            >
              <NumberInput
                className="h-9"
                min="0"
                onValueChange={(basePrice) => update({ basePrice })}
                step="0.01"
                value={item.basePrice}
              />
            </FormField>
            <FormField label="前台状态">
              <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm">
                <Checkbox
                  checked={item.enabled}
                  onCheckedChange={(checked) =>
                    update({ enabled: checked === true })
                  }
                />
                前台启用
              </label>
            </FormField>
            <FormField label="报价方式">
              <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm">
                <Checkbox
                  checked={Boolean(item.quoteRequired)}
                  onCheckedChange={(checked) =>
                    update({ quoteRequired: checked === true })
                  }
                />
                需要客服确认报价
              </label>
            </FormField>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onChange(null)}>
            取消
          </Button>
          <Button disabled={!item?.label.trim()} onClick={onSave}>
            <FloppyDisk size={15} />
            保存项目
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function normalizeItem(item: CmsBookingCatalogItem): CmsBookingCatalogItem {
  return {
    ...item,
    basePrice: Math.max(0, Number(item.basePrice) || 0),
    bathroomPrices: undefined,
    bedroomPrices: undefined,
    description: item.description.trim(),
    label: item.label.trim(),
    studioPrice: undefined,
  }
}
