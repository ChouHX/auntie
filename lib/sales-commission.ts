import type {
  CmsPaymentOrder,
  CmsSalesCommissionSnapshot,
  CmsSalesMember,
} from "@/types/cms"

function findOrderSalesMember(
  order: CmsPaymentOrder,
  members: CmsSalesMember[]
) {
  return members.find(
    (member) =>
      member.id === order.salesMemberId || member.name === order.salesOwner
  )
}

function isSnapshotForOrder(
  order: CmsPaymentOrder,
  snapshot: CmsSalesCommissionSnapshot | undefined
) {
  return Boolean(
    snapshot?.salesMemberId && snapshot.salesMemberId === order.salesMemberId
  )
}

function createSalesCommissionSnapshot(
  member: CmsSalesMember,
  capturedAt = new Date().toISOString()
): CmsSalesCommissionSnapshot {
  return {
    capturedAt,
    commissionAdjustment: normalizeSignedAmount(member.commissionAdjustment),
    commissionPercentage: normalizePercentage(member.commissionPercentage),
    salesMemberId: member.id,
  }
}

function captureOrderSalesCommission(
  order: CmsPaymentOrder,
  members: CmsSalesMember[],
  capturedAt = new Date().toISOString()
) {
  if (isSnapshotForOrder(order, order.salesCommissionSnapshot)) {
    return order
  }

  const member = findOrderSalesMember(order, members)
  if (!member) {
    return order.salesMemberId || order.salesOwner
      ? order
      : { ...order, salesCommissionSnapshot: undefined }
  }

  return {
    ...order,
    salesCommissionSnapshot: createSalesCommissionSnapshot(member, capturedAt),
    salesMemberId: member.id,
    salesOwner: order.salesOwner || member.name,
  }
}

function normalizePercentage(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0
}

function normalizeSignedAmount(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export {
  captureOrderSalesCommission,
  createSalesCommissionSnapshot,
  findOrderSalesMember,
  isSnapshotForOrder,
}
