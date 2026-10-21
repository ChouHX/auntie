import type { CmsCard, CmsPaymentOrder } from "@/types/cms"

function normalizeCardAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : 0
}

function normalizeCardTimes(value: unknown) {
  const times = Number(value)
  return Number.isFinite(times) && times > 0 ? Math.floor(times) : 0
}

/**
 * 次卡单次消耗金额在创建时固定：金额 / 次数。后续充值不改变单次价格。
 */
function getCardSinglePrice(totalTimes: number, amount: number) {
  if (totalTimes <= 0) return 0
  return Number((amount / totalTimes).toFixed(2))
}

function normalizeCard(card: CmsCard): CmsCard {
  const totalTimes = normalizeCardTimes(card.totalTimes)
  const amount = normalizeCardAmount(card.amount)

  return {
    ...card,
    amount,
    createdAt: card.createdAt || "",
    currency: card.currency || "USD",
    customerAvatar: card.customerAvatar ?? "",
    customerName: card.customerName ?? "",
    customerRegion: card.customerRegion ?? "",
    customerRelationId: card.customerRelationId?.trim() ?? "",
    id: card.id?.trim() ?? "",
    rechargeRegion: card.rechargeRegion ?? "",
    rechargeTimes: normalizeCardTimes(card.rechargeTimes),
    // 派生字段不落库，每次读取时按绑定订单重新统计。
    remainingTimes: undefined,
    singlePrice: getCardSinglePrice(totalTimes, amount),
    status: card.status === "disabled" ? "disabled" : "active",
    totalTimes,
    updatedAt: card.updatedAt || "",
    usedTimes: undefined,
  }
}

function normalizeCards(cards: CmsCard[] | undefined): CmsCard[] {
  const seen = new Set<string>()

  return (cards ?? []).map(normalizeCard).filter((card) => {
    if (!card.id || !card.customerRelationId || seen.has(card.id)) {
      return false
    }

    seen.add(card.id)
    return true
  })
}

/** 累计充值金额 = 创建时支付金额 + 后续充值次数 × 固定单次金额。 */
function getCardTotalAmount(card: CmsCard) {
  const rechargeAmount =
    (card.rechargeTimes || 0) * (card.singlePrice || 0)

  return Number(((card.amount || 0) + rechargeAmount).toFixed(2))
}

function getCardTotalTimes(card: CmsCard) {
  return Math.max(
    0,
    Math.floor(card.totalTimes || 0) + Math.floor(card.rechargeTimes || 0)
  )
}

/**
 * 次卡在订单确认收款后才扣次；取消/删除订单后自动返还（不再计入已用）。
 */
function isCardUsageCounted(order: CmsPaymentOrder) {
  return order.status === "paid"
}

function getCardUsedTimes(card: CmsCard, orders: CmsPaymentOrder[]) {
  return orders.filter(
    (order) => order.cardId === card.id && isCardUsageCounted(order)
  ).length
}

function getCardRemainingTimes(card: CmsCard, orders: CmsPaymentOrder[]) {
  return Math.max(0, getCardTotalTimes(card) - getCardUsedTimes(card, orders))
}

function findCardById(cards: CmsCard[], cardId: string | undefined) {
  const target = cardId?.trim()

  return target ? cards.find((card) => card.id === target) : undefined
}

/** 一个客户只能有一张次卡。 */
function findCardByCustomer(
  cards: CmsCard[],
  customerRelationId: string | undefined
) {
  const target = customerRelationId?.trim()

  return target
    ? cards.find((card) => card.customerRelationId === target)
    : undefined
}

function getCardOrders(card: CmsCard, orders: CmsPaymentOrder[]) {
  return [...orders]
    .filter((order) => order.cardId === card.id)
    .toSorted(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() -
        new Date(left.createdAt || 0).getTime()
    )
}

/**
 * 校验订单使用次卡是否合法，并返回该次卡。
 * 一个客户只能有一张卡，且剩余次数必须大于 0（排除当前订单本身）。
 */
function validateCardUsage(
  cards: CmsCard[],
  orders: CmsPaymentOrder[],
  input: {
    cardId: string
    customerRelationId?: string
    excludeOrderId?: string
  }
) {
  const card = findCardById(cards, input.cardId)
  if (!card) throw new Error("次卡不存在。")
  if (card.status !== "active") {
    throw new Error("该次卡已停用，不能继续抵扣。")
  }
  if (card.customerRelationId !== (input.customerRelationId ?? "").trim()) {
    throw new Error("次卡与订单客户不一致。")
  }

  const remaining = getCardRemainingTimes(
    card,
    orders.filter((order) => order.orderId !== input.excludeOrderId)
  )
  if (remaining <= 0) throw new Error("该次卡剩余次数不足。")

  return card
}

/** 在 API 响应中附加只读的已用/剩余次数。 */
function withCardUsage(card: CmsCard, orders: CmsPaymentOrder[]): CmsCard {
  const usedTimes = getCardUsedTimes(card, orders)

  return {
    ...card,
    remainingTimes: Math.max(0, getCardTotalTimes(card) - usedTimes),
    usedTimes,
  }
}

function createCardId(cards: CmsCard[]) {
  const date = new Date()
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("")
  const existingIds = new Set(cards.map((card) => card.id))

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
    const cardId = `CARD${datePart}${randomPart}`

    if (!existingIds.has(cardId)) {
      return cardId
    }
  }

  return `CARD${datePart}${Date.now().toString(36).slice(-6).toUpperCase()}`
}

export {
  createCardId,
  findCardByCustomer,
  findCardById,
  getCardOrders,
  getCardRemainingTimes,
  getCardSinglePrice,
  getCardTotalAmount,
  getCardTotalTimes,
  getCardUsedTimes,
  isCardUsageCounted,
  normalizeCard,
  normalizeCards,
  validateCardUsage,
  withCardUsage,
}
