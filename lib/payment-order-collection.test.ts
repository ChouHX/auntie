import assert from "node:assert/strict"
import test from "node:test"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const orderCollection = await import("./payment-order-collection.ts")
const {
  dedupePaymentOrdersById,
  deletePaymentOrderFromCollection,
  findPaymentOrderById,
  upsertPaymentOrderInCollection,
} = orderCollection
import type { CmsPaymentOrder } from "@/types/cms"

test("finds a legacy mock order after its id is normalized", () => {
  const order = createOrder({ orderId: "AC-2506-0085" })

  assert.equal(findPaymentOrderById([order], "AC25060085"), order)
})

test("updates a legacy mock order instead of creating a duplicate", () => {
  const original = createOrder({ orderId: "AC-2506-0085" })
  const updated = createOrder({
    customerName: "Updated",
    orderId: "AC25060085",
  })
  const orders = upsertPaymentOrderInCollection([original], updated)

  assert.equal(orders.length, 1)
  assert.equal(orders[0], updated)
})

test("collapses duplicates created by the old exact-id comparison", () => {
  const canonical = createOrder({ orderId: "AC25060085" })
  const legacy = createOrder({ orderId: "AC-2506-0085" })
  const updated = createOrder({
    customerName: "Updated",
    orderId: "AC25060085",
  })
  const orders = upsertPaymentOrderInCollection([canonical, legacy], updated)

  assert.deepEqual(orders, [updated])
  assert.deepEqual(dedupePaymentOrdersById([canonical, legacy]), [canonical])
})

test("deletes all formatting variants of an editable order id", () => {
  const target = createOrder({ orderId: "AC-2506-0085" })
  const duplicate = createOrder({ orderId: "AC25060085" })
  const other = createOrder({ orderId: "ORD-OTHER" })

  assert.deepEqual(
    deletePaymentOrderFromCollection([target, duplicate, other], "AC25060085"),
    [other]
  )
})

test("keeps completed-order protection after normalized lookup", () => {
  const completed = createOrder({
    orderId: "AC-2506-0085",
    serviceDate: "2026-08-20",
    status: "paid",
  })
  const updated = createOrder({ orderId: "AC25060085" })

  assert.throws(
    () => upsertPaymentOrderInCollection([completed], updated),
    /已完成订单只能查看详情/
  )
})

function createOrder(
  overrides: Partial<CmsPaymentOrder> = {}
): CmsPaymentOrder {
  return {
    amount: "$100.00",
    contact: "+1 555-555-5555",
    createdAt: "2026-08-22T00:00:00.000Z",
    customerName: "Customer",
    note: "",
    orderId: "ORD-TEST",
    serviceAddress: "Test address",
    serviceArea: "Test area",
    serviceDate: "2026-08-23",
    serviceType: "Regular cleaning",
    status: "unpaid",
    updatedAt: "2026-08-22T00:00:00.000Z",
    ...overrides,
  }
}
