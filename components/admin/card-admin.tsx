"use client"

import { useMemo, useState } from "react"
import {
  ArrowsClockwise,
  CaretRight,
  CheckCircle,
  DotsThree,
  PencilSimple,
  Plus,
  Prohibit,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  RecordsPanel,
  type PersistContent,
  useAdminNoticeDialog,
} from "@/components/admin/admin-shared"
import {
  OrderCustomerSelect,
  OrderServiceAreaSelect,
} from "@/components/admin/order-admin"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  createCardId,
  getCardOrders,
  getCardRemainingTimes,
  getCardSinglePrice,
  getCardTotalAmount,
  getCardTotalTimes,
  getCardUsedTimes,
} from "@/lib/cards"
import type { CmsCard, CmsContent } from "@/types/cms"

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

type CardForm = {
  amount: string
  currency: string
  customerAvatar: string
  customerName: string
  customerRegion: string
  customerRelationId: string
  rechargeRegion: string
  totalTimes: string
}

const emptyForm: CardForm = {
  amount: "",
  currency: "USD",
  customerAvatar: "",
  customerName: "",
  customerRegion: "",
  customerRelationId: "",
  rechargeRegion: "",
  totalTimes: "",
}

const orderStatusLabels: Record<string, string> = {
  awaiting_confirmation: "待确认",
  cancelled: "已取消",
  failed: "失败",
  paid: "已付款（次卡）",
  pending: "待付款",
  unpaid: "未付款",
}

function formatMoney(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("zh-CN", {
      currency: currency || "USD",
      maximumFractionDigits: 2,
      style: "currency",
    }).format(amount)
  } catch {
    return `${currency || "USD"} ${amount.toFixed(2)}`
  }
}

export function CardAdmin({
  content,
  isSaving,
  onCommit,
  token,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
  token: string
}) {
  const cards = content.cards ?? []
  const orders = content.paymentOrders ?? []
  const [query, setQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CardForm>(emptyForm)
  const [editingCard, setEditingCard] = useState<CmsCard | null>(null)
  const [editRegions, setEditRegions] = useState({
    customerRegion: "",
    rechargeRegion: "",
  })
  const [rechargeCard, setRechargeCard] = useState<CmsCard | null>(null)
  const [rechargeTimes, setRechargeTimes] = useState("1")
  const [rechargeRegion, setRechargeRegion] = useState("")
  const [ordersCard, setOrdersCard] = useState<CmsCard | null>(null)
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()

  const filteredCards = useMemo(() => {
    const list = content.cards ?? []
    const keyword = query.trim().toLowerCase()
    if (!keyword) return list

    return list.filter((card) =>
      [
        card.customerName,
        card.customerRelationId,
        card.customerRegion,
        card.rechargeRegion,
      ].some((value) => value.toLowerCase().includes(keyword))
    )
  }, [content.cards, query])

  const formTimes = Math.floor(Number(form.totalTimes) || 0)
  const formAmount = Number(form.amount) || 0
  const formSinglePrice = getCardSinglePrice(formTimes, formAmount)
  const rechargeTimesValue = Math.floor(Number(rechargeTimes) || 0)
  const rechargeAmount = rechargeCard
    ? Number((rechargeCard.singlePrice * rechargeTimesValue).toFixed(2))
    : 0

  function getUsed(card: CmsCard) {
    return card.usedTimes ?? getCardUsedTimes(card, orders)
  }

  function getRemaining(card: CmsCard) {
    return card.remainingTimes ?? getCardRemainingTimes(card, orders)
  }

  async function handleCreate() {
    if (!form.customerRelationId) {
      toast.error("请选择客户")
      return
    }
    if (formTimes <= 0) {
      toast.error("次卡次数必须大于 0")
      return
    }
    if (formAmount <= 0) {
      toast.error("支付金额必须大于 0")
      return
    }
    if (cards.some((card) => card.customerRelationId === form.customerRelationId)) {
      toast.error("该客户已有次卡，请直接充值")
      return
    }

    const now = new Date().toISOString()
    const card: CmsCard = {
      amount: Number(formAmount.toFixed(2)),
      createdAt: now,
      currency: form.currency,
      customerAvatar: form.customerAvatar,
      customerName: form.customerName,
      customerRegion: form.customerRegion.trim(),
      customerRelationId: form.customerRelationId,
      id: createCardId(cards),
      rechargeRegion: form.rechargeRegion.trim(),
      rechargeTimes: 0,
      singlePrice: formSinglePrice,
      status: "active",
      totalTimes: formTimes,
      updatedAt: now,
    }
    const saved = await onCommit(
      (current) => ({
        ...current,
        cards: [card, ...(current.cards ?? [])],
      }),
      "次卡已创建"
    )
    if (saved) {
      setCreateOpen(false)
      setForm(emptyForm)
    }
  }

  async function handleEdit() {
    if (!editingCard) return
    const saved = await onCommit(
      (current) => ({
        ...current,
        cards: (current.cards ?? []).map((card) =>
          card.id === editingCard.id
            ? {
                ...card,
                customerRegion: editRegions.customerRegion.trim(),
                rechargeRegion: editRegions.rechargeRegion.trim(),
                updatedAt: new Date().toISOString(),
              }
            : card
        ),
      }),
      "次卡已更新"
    )
    if (saved) setEditingCard(null)
  }

  async function handleRecharge() {
    if (!rechargeCard) return
    if (rechargeTimesValue <= 0) {
      toast.error("充值次数必须大于 0")
      return
    }
    const saved = await onCommit(
      (current) => ({
        ...current,
        cards: (current.cards ?? []).map((card) =>
          card.id === rechargeCard.id
            ? {
                ...card,
                rechargeRegion: rechargeRegion.trim() || card.rechargeRegion,
                rechargeTimes: card.rechargeTimes + rechargeTimesValue,
                updatedAt: new Date().toISOString(),
              }
            : card
        ),
      }),
      "次卡充值成功"
    )
    if (saved) setRechargeCard(null)
  }

  async function handleToggleStatus(card: CmsCard) {
    await onCommit(
      (current) => ({
        ...current,
        cards: (current.cards ?? []).map((item) =>
          item.id === card.id
            ? {
                ...item,
                status: item.status === "active" ? "disabled" : "active",
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      }),
      card.status === "active" ? "次卡已停用" : "次卡已启用"
    )
  }

  async function handleDelete(card: CmsCard) {
    if (getUsed(card) > 0) {
      toast.error("已产生使用的次卡不能删除，请改为停用")
      return
    }
    const confirmed = await confirmAction({
      title: "删除次卡",
      description: `确认删除 ${card.customerName} 的次卡？删除后不可恢复。`,
    })
    if (!confirmed) return

    await onCommit(
      (current) => ({
        ...current,
        cards: (current.cards ?? []).filter((item) => item.id !== card.id),
      }),
      "次卡已删除"
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      {noticeDialog}
      <RecordsPanel
        action={
          <Button
            className="h-8"
            disabled={isSaving}
            onClick={() => {
              setForm(emptyForm)
              setCreateOpen(true)
            }}
            size="sm"
          >
            <Plus size={15} weight="bold" />
            新建次卡
          </Button>
        }
        count={filteredCards.length}
        description="管理客户次卡：次数、充值、单次金额与绑定订单。"
        query={query}
        searchPlaceholder="搜索客户、地区"
        setQuery={setQuery}
        title="次卡管理"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[1080px] text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>客户</TableHead>
                <TableHead>客户地区</TableHead>
                <TableHead>充值地区</TableHead>
                <TableHead>累计购买次数</TableHead>
                <TableHead>已使用次数</TableHead>
                <TableHead>剩余次数</TableHead>
                <TableHead>累计充值金额 / 单次</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="sticky right-0 z-20 w-12 min-w-12 border-l border-border bg-card text-center">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.length ? (
                filteredCards.map((card) => {
                  const used = getUsed(card)
                  const remaining = getRemaining(card)
                  const total = getCardTotalTimes(card)

                  return (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {card.customerAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element -- 企业微信提供远程头像地址。
                            <img
                              alt=""
                              className="size-7 shrink-0 rounded-full bg-muted object-cover"
                              loading="lazy"
                              src={card.customerAvatar}
                            />
                          ) : (
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                              {card.customerName.slice(0, 1) || "?"}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {card.customerName}
                            </div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {card.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{card.customerRegion || "-"}</TableCell>
                      <TableCell>{card.rechargeRegion || "-"}</TableCell>
                      <TableCell className="font-medium">{total}</TableCell>
                      <TableCell>{used}</TableCell>
                      <TableCell
                        className={
                          remaining > 0
                            ? "font-medium"
                            : "font-medium text-destructive"
                        }
                      >
                        {remaining}
                      </TableCell>
                      <TableCell>
                        <div>
                          {formatMoney(
                            card.currency,
                            getCardTotalAmount(card)
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          单次 {formatMoney(card.currency, card.singlePrice)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              aria-label={
                                card.status === "active" ? "生效中" : "已停用"
                              }
                              className="inline-flex cursor-help items-center justify-center"
                            >
                              <span
                                className={`size-2.5 rounded-full ${
                                  card.status === "active"
                                    ? "bg-emerald-500 ring-4 ring-emerald-500/15"
                                    : "bg-zinc-400 ring-4 ring-zinc-400/15"
                                }`}
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {card.status === "active"
                              ? "生效中 · 可用于订单次卡抵扣"
                              : "已停用 · 暂不可用于订单抵扣，可在操作中启用"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="sticky right-0 z-10 border-l border-border bg-card text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label="次卡操作"
                              className="size-7"
                              size="icon-sm"
                              variant="ghost"
                            >
                              <DotsThree size={16} weight="bold" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onSelect={() => setOrdersCard(card)}
                            >
                              <CaretRight size={14} />
                              查看订单
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setRechargeCard(card)
                                setRechargeTimes("1")
                                setRechargeRegion(card.rechargeRegion)
                              }}
                            >
                              <ArrowsClockwise size={14} />
                              充值
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingCard(card)
                                setEditRegions({
                                  customerRegion: card.customerRegion,
                                  rechargeRegion: card.rechargeRegion,
                                })
                              }}
                            >
                              <PencilSimple size={14} />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleToggleStatus(card)}
                            >
                              {card.status === "active" ? (
                                <Prohibit size={14} />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              {card.status === "active" ? "停用" : "启用"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => handleDelete(card)}
                            >
                              <Trash size={14} />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    className="py-10 text-center text-muted-foreground"
                    colSpan={9}
                  >
                    暂无次卡
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </RecordsPanel>

      <Dialog
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setForm(emptyForm)
        }}
        open={createOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建次卡</DialogTitle>
            <DialogDescription>
              一个客户只能有一张次卡；单次金额 = 支付金额 / 次卡次数，创建后固定，充值不改变单次金额。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField className="sm:col-span-2" label="客户" required>
              <OrderCustomerSelect
                customerName={form.customerName}
                customerRelationId={form.customerRelationId}
                onSelect={(customer) =>
                  setForm((current) => ({
                    ...current,
                    customerAvatar: customer.avatar ?? "",
                    customerName:
                      customer.nameAndType.split("@")[0].trim(),
                    customerRegion:
                      current.customerRegion || customer.region || "",
                    customerRelationId: customer.relationId,
                  }))
                }
                token={token}
              />
            </FormField>
            <FormField label="客户地区">
              <Input
                className="h-9 rounded-md"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerRegion: event.target.value,
                  }))
                }
                placeholder="客户所在地区"
                value={form.customerRegion}
              />
            </FormField>
            <FormField label="充值地区">
              <OrderServiceAreaSelect
                onChange={(rechargeRegion) =>
                  setForm((current) => ({ ...current, rechargeRegion }))
                }
                value={form.rechargeRegion}
              />
            </FormField>
            <FormField label="次卡次数" required>
              <Input
                className="h-9 rounded-md"
                min="1"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    totalTimes: event.target.value,
                  }))
                }
                step="1"
                type="number"
                value={form.totalTimes}
              />
            </FormField>
            <FormField label="支付金额" required>
              <Input
                className="h-9 rounded-md"
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                step="0.01"
                type="number"
                value={form.amount}
              />
            </FormField>
            <FormField label="币种">
              <Select
                onValueChange={(currency) =>
                  setForm((current) => ({ ...current, currency }))
                }
                value={form.currency}
              >
                <SelectTrigger className="h-9 rounded-md">
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
            <FormField label="单次消耗金额">
              <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium">
                {formatMoney(form.currency, formSinglePrice)}
              </div>
            </FormField>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setCreateOpen(false)}
              size="sm"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={isSaving} onClick={handleCreate} size="sm">
              创建次卡
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setEditingCard(null)
        }}
        open={Boolean(editingCard)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑次卡</DialogTitle>
            <DialogDescription>
              {editingCard?.customerName} · 单次{" "}
              {editingCard
                ? formatMoney(editingCard.currency, editingCard.singlePrice)
                : "-"}
              。次数与金额创建后不可修改。
            </DialogDescription>
          </DialogHeader>
          {editingCard ? (
            <div className="grid gap-3">
              <FormField label="客户地区">
                <Input
                  className="h-9 rounded-md"
                  onChange={(event) =>
                    setEditRegions((current) => ({
                      ...current,
                      customerRegion: event.target.value,
                    }))
                  }
                  value={editRegions.customerRegion}
                />
              </FormField>
              <FormField label="充值地区">
                <OrderServiceAreaSelect
                  onChange={(rechargeRegion) =>
                    setEditRegions((current) => ({
                      ...current,
                      rechargeRegion,
                    }))
                  }
                  value={editRegions.rechargeRegion}
                />
              </FormField>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => setEditingCard(null)}
              size="sm"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={isSaving} onClick={handleEdit} size="sm">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setRechargeCard(null)
        }}
        open={Boolean(rechargeCard)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>次卡充值</DialogTitle>
            <DialogDescription>
              {rechargeCard?.customerName} · 当前剩余{" "}
              {rechargeCard ? getRemaining(rechargeCard) : 0}{" "}
              次，单次{" "}
              {rechargeCard
                ? formatMoney(rechargeCard.currency, rechargeCard.singlePrice)
                : "-"}
              。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <FormField label="充值次数" required>
              <Input
                className="h-9 rounded-md"
                min="1"
                onChange={(event) => setRechargeTimes(event.target.value)}
                step="1"
                type="number"
                value={rechargeTimes}
              />
            </FormField>
            <FormField label="充值地区">
              <OrderServiceAreaSelect
                onChange={setRechargeRegion}
                value={rechargeRegion}
              />
            </FormField>
            <FormField label="本次充值金额">
              <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium">
                {rechargeCard
                  ? formatMoney(rechargeCard.currency, rechargeAmount)
                  : "-"}
              </div>
            </FormField>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setRechargeCard(null)}
              size="sm"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={isSaving} onClick={handleRecharge} size="sm">
              确认充值
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setOrdersCard(null)
        }}
        open={Boolean(ordersCard)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>次卡绑定订单</DialogTitle>
            <DialogDescription>
              {ordersCard?.customerName} · 已用{" "}
              {ordersCard ? getUsed(ordersCard) : 0} 次，剩余{" "}
              {ordersCard ? getRemaining(ordersCard) : 0} 次。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>服务日期</TableHead>
                  <TableHead>服务类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">订单金额</TableHead>
                  <TableHead className="text-right">阿姨薪资</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersCard && getCardOrders(ordersCard, orders).length ? (
                  getCardOrders(ordersCard, orders).map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">
                        {order.orderId}
                      </TableCell>
                      <TableCell>{order.serviceDate || "-"}</TableCell>
                      <TableCell>{order.serviceType || "-"}</TableCell>
                      <TableCell>
                        {orderStatusLabels[order.status] ?? order.status}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(
                          order.currency || "USD",
                          order.amountValue ?? order.cardUsageAmount ?? 0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(
                          order.currency || "USD",
                          order.auntieSalary ?? 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="py-8 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      暂无绑定订单
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOrdersCard(null)}
              size="sm"
              variant="outline"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
