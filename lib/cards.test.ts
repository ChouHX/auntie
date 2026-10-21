import assert from "node:assert/strict"
import test from "node:test"

import type { CmsCard, CmsPaymentOrder } from "@/types/cms"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const cardHelpers = await import("./cards.ts")

const now = "2026-10-19T08:00:00.000Z"

function card(patch: Partial<CmsCard> = {}): CmsCard {
  const totalTimes = patch.totalTimes ?? 3
  const amount = patch.amount ?? 300

  return {
    amount,
    createdAt: now,
    currency: "USD",
    customerName: "李女士",
    customerRegion: "A 区",
    customerRelationId: "relation-1",
    id: "CARD1",
    rechargeRegion: "B 区",
    rechargeTimes: 0,
    singlePrice: cardHelpers.getCardSinglePrice(totalTimes, amount),
    status: "active",
    totalTimes,
    updatedAt: now,
    ...patch,
  }
}

function order(patch: Partial<CmsPaymentOrder> = {}): CmsPaymentOrder {
  return {
    amount: "100",
    amountValue: 100,
    contact: "1234567890",
    createdAt: now,
    customerName: "李女士",
    note: "",
    orderId: "ORD1",
    serviceAddress: "地址",
    serviceArea: "B 区",
    serviceDate: "2026-11-01",
    serviceType: "日常清洁",
    status: "paid",
    updatedAt: now,
    ...patch,
  }
}

test("次卡单次金额按创建时金额固定", () => {
  assert.equal(cardHelpers.getCardSinglePrice(3, 300), 100)
  assert.equal(cardHelpers.getCardSinglePrice(3, 100), 33.33)
  assert.equal(cardHelpers.getCardSinglePrice(0, 300), 0)
})

test("累计充值金额包含创建金额与充值金额", () => {
  assert.equal(cardHelpers.getCardTotalAmount(card()), 300)
  assert.equal(
    cardHelpers.getCardTotalAmount(card({ rechargeTimes: 2 })),
    500
  )
})

test("总次数包含充值次数，已用只统计已付款的绑定订单", () => {
  const subject = card({ rechargeTimes: 2 })
  assert.equal(cardHelpers.getCardTotalTimes(subject), 5)

  const orders = [
    order({ orderId: "A", cardId: "CARD1", status: "paid" }),
    order({ orderId: "B", cardId: "CARD1", status: "paid" }),
    order({ orderId: "C", cardId: "CARD1", status: "unpaid" }),
    order({ orderId: "D", cardId: "OTHER", status: "paid" }),
  ]
  assert.equal(cardHelpers.getCardUsedTimes(subject, orders), 2)
  assert.equal(cardHelpers.getCardRemainingTimes(subject, orders), 3)
})

test("取消或删除的订单不再占用次数", () => {
  const subject = card()
  const orders = [
    order({ orderId: "A", cardId: "CARD1", status: "paid" }),
    order({ orderId: "B", cardId: "CARD1", status: "cancelled" }),
  ]

  assert.equal(cardHelpers.getCardUsedTimes(subject, orders), 1)
  assert.equal(cardHelpers.getCardRemainingTimes(subject, orders), 2)
})

test("次卡使用校验拒绝停用、客户不一致和次数不足", () => {
  assert.throws(
    () =>
      cardHelpers.validateCardUsage([card({ totalTimes: 0 })], [], {
        cardId: "CARD1",
        customerRelationId: "relation-1",
      }),
    /剩余次数不足/
  )
  assert.throws(
    () =>
      cardHelpers.validateCardUsage([card({ status: "disabled" })], [], {
        cardId: "CARD1",
        customerRelationId: "relation-1",
      }),
    /已停用/
  )
  assert.throws(
    () =>
      cardHelpers.validateCardUsage([card()], [], {
        cardId: "CARD1",
        customerRelationId: "relation-2",
      }),
    /客户不一致/
  )

  const used = [order({ orderId: "A", cardId: "CARD1", status: "paid" })]
  assert.throws(
    () =>
      cardHelpers.validateCardUsage([card({ totalTimes: 1 })], used, {
        cardId: "CARD1",
        customerRelationId: "relation-1",
      }),
    /剩余次数不足/
  )
  // 编辑当前订单时不应把它自己算作已用。
  assert.ok(
    cardHelpers.validateCardUsage([card({ totalTimes: 1 })], used, {
      cardId: "CARD1",
      customerRelationId: "relation-1",
      excludeOrderId: "A",
    })
  )
})

test("规范化次卡会去重、重算单次金额并丢弃派生字段", () => {
  const normalized = cardHelpers.normalizeCards([
    card({ id: "CARD1", remainingTimes: 99, usedTimes: 99 }),
    card({ id: "CARD1" }),
    card({ customerRelationId: "relation-2", id: "CARD2" }),
    card({ customerRelationId: "relation-3", id: "" }),
  ])

  assert.equal(normalized.length, 2)
  assert.equal(normalized[0].singlePrice, 100)
  assert.equal(normalized[0].usedTimes, undefined)
  assert.equal(normalized[0].remainingTimes, undefined)
})

test("按客户查找次卡，一个客户只有一张", () => {
  const list = [
    card({ id: "CARD1" }),
    card({ customerRelationId: "relation-2", id: "CARD2" }),
  ]

  assert.equal(cardHelpers.findCardByCustomer(list, "relation-1")?.id, "CARD1")
  assert.equal(cardHelpers.findCardByCustomer(list, " missing "), undefined)
})

test("API 响应的派生次数来自绑定订单", () => {
  const subject = card({ rechargeTimes: 1 })
  const orders = [order({ orderId: "A", cardId: "CARD1", status: "paid" })]
  const summary = cardHelpers.withCardUsage(subject, orders)

  assert.equal(summary.usedTimes, 1)
  assert.equal(summary.remainingTimes, 3)
})
