// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { findSalesMemberForStudentTags } from "./sales-attribution.ts"
import type { WecomCustomer } from "@/lib/wecom-types"
import type { CmsSalesMember } from "@/types/cms"

type SalesCustomer = Pick<
  WecomCustomer,
  | "addTime"
  | "addWay"
  | "auntie"
  | "avatar"
  | "corpName"
  | "description"
  | "gender"
  | "nameAndType"
  | "position"
  | "region"
  | "relationId"
  | "remarkMobiles"
  | "studentType"
>

type SalesCustomerPage = {
  customers: SalesCustomer[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

function createSalesCustomerPage(
  customers: WecomCustomer[],
  members: CmsSalesMember[],
  currentMember: CmsSalesMember,
  options: { page: number; pageSize: number; query: string }
): SalesCustomerPage {
  const query = options.query.trim().toLocaleLowerCase()
  const ownedCustomers = customers.filter(
    (customer) =>
      findSalesMemberForStudentTags(customer.studentType, members)?.id ===
      currentMember.id
  )
  const filtered = query
    ? ownedCustomers.filter((customer) =>
        [
          customer.nameAndType,
          customer.corpName,
          customer.position,
          customer.studentType,
          customer.region,
          customer.auntie,
          customer.description,
          customer.remarkMobiles,
          customer.addWay,
        ].some((value) => value.toLocaleLowerCase().includes(query))
      )
    : ownedCustomers
  const pageSize = clamp(options.pageSize, 10, 50, 10)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(1, Math.trunc(options.page) || 1), totalPages)

  return {
    customers: filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map(toSalesCustomer),
    pagination: {
      page,
      pageSize,
      totalCount: filtered.length,
      totalPages,
    },
  }
}

function toSalesCustomer(customer: WecomCustomer): SalesCustomer {
  return {
    addTime: customer.addTime,
    addWay: customer.addWay,
    auntie: customer.auntie,
    avatar: customer.avatar,
    corpName: customer.corpName,
    description: customer.description,
    gender: customer.gender,
    nameAndType: customer.nameAndType,
    position: customer.position,
    region: customer.region,
    relationId: customer.relationId,
    remarkMobiles: customer.remarkMobiles,
    studentType: customer.studentType,
  }
}

function clamp(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.trunc(value)))
    : fallback
}

export { createSalesCustomerPage }
export type { SalesCustomer, SalesCustomerPage }
