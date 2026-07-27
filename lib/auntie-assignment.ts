import type { CmsPaymentOrder, CmsTeamMember } from "@/types/cms"

type AuntieAssignmentMode = "auto" | "manual"

const AUTO_AUNTIE_VALUE = "__auto__"
const NO_AUNTIE_VALUE = "__none__"

function getAuntieAvatarSrc(auntie: CmsTeamMember) {
  return auntie.avatarThumb || auntie.avatar || ""
}

function getEligibleAuntiesForArea(
  members: CmsTeamMember[],
  serviceArea: string,
  options: { onlyAvailable?: boolean } = {}
) {
  const onlyAvailable = options.onlyAvailable ?? true

  return members
    .filter((member) => {
      if (onlyAvailable && member.status !== "available") {
        return false
      }

      return isAuntieServingArea(member, serviceArea)
    })
    .toSorted((left, right) => {
      const statusRank =
        getAuntieStatusRank(left.status) - getAuntieStatusRank(right.status)

      if (statusRank !== 0) {
        return statusRank
      }

      return right.rating - left.rating || left.name.localeCompare(right.name)
    })
}

function pickAutoAssignedAuntie(
  serviceArea: string,
  members: CmsTeamMember[],
  orders: CmsPaymentOrder[] = [],
  activeLoadByAuntieId: Record<string, number> = {}
) {
  const eligible = getEligibleAuntiesForArea(members, serviceArea, {
    onlyAvailable: true,
  })

  return eligible.toSorted((left, right) => {
    const leftLoad =
      activeLoadByAuntieId[left.id] ??
      getActiveAssignedOrderCount(left.id, orders)
    const rightLoad =
      activeLoadByAuntieId[right.id] ??
      getActiveAssignedOrderCount(right.id, orders)

    return (
      leftLoad - rightLoad ||
      right.rating - left.rating ||
      right.completedCount - left.completedCount ||
      left.name.localeCompare(right.name)
    )
  })[0]
}

function pickAutoAssignedAuntieFromPreFiltered(
  members: CmsTeamMember[],
  orders: CmsPaymentOrder[] = [],
  activeLoadByAuntieId: Record<string, number> = {}
) {
  return members
    .filter((member) => member.status === "available")
    .toSorted((left, right) => {
      const leftLoad =
        activeLoadByAuntieId[left.id] ??
        getActiveAssignedOrderCount(left.id, orders)
      const rightLoad =
        activeLoadByAuntieId[right.id] ??
        getActiveAssignedOrderCount(right.id, orders)

      return (
        leftLoad - rightLoad ||
        right.rating - left.rating ||
        right.completedCount - left.completedCount ||
        left.name.localeCompare(right.name)
      )
    })[0]
}

function isAuntieServingArea(member: CmsTeamMember, serviceArea: string) {
  const normalizedTarget = normalizeAreaText(serviceArea)

  if (!normalizedTarget) {
    return true
  }

  const candidates = [member.area, ...(member.serviceAreas ?? [])]
    .map(normalizeAreaText)
    .filter(Boolean)

  if (!candidates.length) {
    return false
  }

  const targetParts = getAreaParts(serviceArea)
  const targetCity = targetParts[0] ?? normalizedTarget

  return candidates.some((candidate) => {
    if (
      candidate === normalizedTarget ||
      candidate.includes(normalizedTarget) ||
      normalizedTarget.includes(candidate)
    ) {
      return true
    }

    const candidateParts = getAreaParts(candidate)
    const candidateCity = candidateParts[0] ?? candidate

    return Boolean(
      targetCity &&
      candidateCity &&
      (targetCity === candidateCity ||
        targetCity.includes(candidateCity) ||
        candidateCity.includes(targetCity))
    )
  })
}

function isPaymentOrderCompleted(order: CmsPaymentOrder, now = new Date()) {
  if (order.status !== "paid") {
    return false
  }

  const serviceDate = order.serviceDate ? new Date(order.serviceDate) : null

  if (!serviceDate || Number.isNaN(serviceDate.getTime())) {
    return false
  }

  serviceDate.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  return serviceDate < today
}

function getActiveAssignedOrderCount(
  auntieId: string,
  orders: CmsPaymentOrder[]
) {
  return orders.filter(
    (order) =>
      order.assignedAuntieId === auntieId &&
      order.status !== "failed" &&
      order.status !== "cancelled" &&
      !isPaymentOrderCompleted(order)
  ).length
}

function getAuntieStatusRank(status: CmsTeamMember["status"]) {
  if (status === "available") return 0
  if (status === "on-task") return 1
  if (status === "on-leave") return 2
  return 3
}

function normalizeAreaText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()（）]/g, " ")
    .replace(/[·/|,，、\-]+/g, " ")
    .replace(/\s+/g, " ")
}

function getAreaParts(value: string) {
  return value
    .split(/[·/|,，、\-]+/)
    .map(normalizeAreaText)
    .filter(Boolean)
}

export {
  AUTO_AUNTIE_VALUE,
  NO_AUNTIE_VALUE,
  getAuntieAvatarSrc,
  getEligibleAuntiesForArea,
  getActiveAssignedOrderCount,
  isAuntieServingArea,
  isPaymentOrderCompleted,
  pickAutoAssignedAuntie,
  pickAutoAssignedAuntieFromPreFiltered,
  type AuntieAssignmentMode,
}
