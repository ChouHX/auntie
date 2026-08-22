import type { NextRequest } from "next/server"

import {
  isAdminToken,
  readCmsContent,
  updateCmsContent,
  writeCmsContent,
} from "@/lib/cms-store"
import { createAuntieStatsMap } from "@/lib/admin-analytics"
import {
  deletePaymentOrderFromCollection,
  upsertPaymentOrderInCollection,
} from "@/lib/payment-order-collection"
import { findSalesMemberForStudentTags } from "@/lib/sales-attribution"
import { captureOrderSalesCommission } from "@/lib/sales-commission"
import { calculateOrderFinancialsSafely } from "@/lib/sales-formula"
import { getWecomCustomerByRelationId } from "@/lib/wecom-store"
import type { CmsContent, CmsPaymentOrder } from "@/types/cms"

type AdminContentSection =
  | "account"
  | "aunties"
  | "blogs"
  | "categories"
  | "customers"
  | "dashboard"
  | "faq"
  | "gallery"
  | "orders"
  | "paymentSettings"
  | "reviews"
  | "services"
  | "serviceAreas"
  | "shell"
  | "siteSettings"

type AdminContentPatchBody = {
  action?: "delete-member" | "delete-order" | "delete-post" | "upsert-order"
  content?: Partial<CmsContent>
  memberId?: string
  order?: CmsPaymentOrder
  orderId?: string
  params?: {
    page?: number
    pageSize?: number
    query?: string
    section?: AdminContentSection
    status?: string
  }
  postIds?: string[]
  section?: AdminContentSection
}

const adminContentSections = new Set<AdminContentSection>([
  "account",
  "aunties",
  "blogs",
  "categories",
  "customers",
  "dashboard",
  "faq",
  "gallery",
  "orders",
  "paymentSettings",
  "reviews",
  "services",
  "serviceAreas",
  "shell",
  "siteSettings",
])

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  return isAdminToken(token ?? null)
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Admin authentication is required.",
      },
      { status: 401 }
    )
  }

  const content = await readCmsContent()
  const section = getRequestedSection(request.nextUrl.searchParams)

  if (!section) {
    return Response.json(content)
  }

  return Response.json(
    createSectionResponse(content, section, request.nextUrl.searchParams)
  )
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Admin authentication is required.",
      },
      { status: 401 }
    )
  }

  const content = (await request.json()) as CmsContent
  const saved = await writeCmsContent(content)

  return Response.json(saved)
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Admin authentication is required.",
      },
      { status: 401 }
    )
  }

  const payload = (await request.json()) as AdminContentPatchBody
  const section =
    payload.section ??
    payload.params?.section ??
    getRequestedSection(request.nextUrl.searchParams)

  if (!section) {
    return Response.json(
      {
        error: "section_required",
        message: "A content section is required.",
      },
      { status: 400 }
    )
  }

  let saved: CmsContent

  try {
    const orderForUpsert =
      payload.action === "upsert-order" && payload.order
        ? payload.order
        : payload.order
    const attributionCustomer = orderForUpsert?.customerRelationId
      ? await getWecomCustomerByRelationId(orderForUpsert.customerRelationId)
      : null

    saved = await updateCmsContent((current) => {
      if (payload.action === "upsert-order") {
        if (!orderForUpsert) {
          throw new Error("Order payload is required.")
        }

        return upsertPaymentOrder(
          current,
          applyWecomSalesAttribution(
            orderForUpsert,
            attributionCustomer?.studentType,
            current.salesMembers
          )
        )
      }

      if (payload.action === "delete-order") {
        if (!payload.orderId) {
          throw new Error("Order id is required.")
        }

        return deletePaymentOrder(current, payload.orderId)
      }

      if (payload.action === "delete-member") {
        if (!payload.memberId) {
          throw new Error("Member id is required.")
        }

        return {
          ...current,
          teamMembers: current.teamMembers.filter(
            (member) => member.id !== payload.memberId
          ),
        }
      }

      if (payload.action === "delete-post") {
        const ids = payload.postIds ?? []
        if (!ids.length) {
          throw new Error("Post ids are required.")
        }
        const idSet = new Set(ids)

        return {
          ...current,
          blogPosts: current.blogPosts.filter((post) => !idSet.has(post.id)),
        }
      }

      return applySectionPatch(current, section, payload.content ?? {})
    })
  } catch (error) {
    return Response.json(
      {
        error: "admin_content_update_failed",
        message: error instanceof Error ? error.message : "Update failed.",
      },
      { status: 400 }
    )
  }

  return Response.json(
    createSectionResponse(
      saved,
      section,
      createResponseSearchParams(payload, request)
    )
  )
}

function applyWecomSalesAttribution(
  order: CmsPaymentOrder,
  studentTags: string | undefined,
  salesMembers: CmsContent["salesMembers"]
) {
  const salesMember = findSalesMemberForStudentTags(studentTags, salesMembers)
  if (!salesMember) {
    return order.salesOwnerSource === "wecom_member" ||
      order.salesOwnerSource === "wecom_tag"
      ? {
          ...order,
          salesMemberId: undefined,
          salesCommissionSnapshot: undefined,
          salesOwner: "",
          salesOwnerSource: undefined,
        }
      : order
  }

  return captureOrderSalesCommission(
    {
      ...order,
      salesMemberId: salesMember.id,
      salesOwner: salesMember.name,
      salesOwnerSource: "wecom_tag" as const,
    },
    salesMembers
  )
}

function getRequestedSection(searchParams: URLSearchParams) {
  const section = searchParams.get("section")

  if (!section || !adminContentSections.has(section as AdminContentSection)) {
    return null
  }

  return section as AdminContentSection
}

function createResponseSearchParams(
  payload: AdminContentPatchBody,
  request: NextRequest
) {
  const searchParams = new URLSearchParams(request.nextUrl.searchParams)

  if (payload.params?.section) {
    searchParams.set("section", payload.params.section)
  }

  if (payload.params?.page) {
    searchParams.set("page", String(payload.params.page))
  }

  if (payload.params?.pageSize) {
    searchParams.set("pageSize", String(payload.params.pageSize))
  }

  if (payload.params?.query !== undefined) {
    setOptionalSearchParam(searchParams, "query", payload.params.query)
  }

  if (payload.params?.status !== undefined) {
    setOptionalSearchParam(searchParams, "status", payload.params.status)
  }

  return searchParams
}

function setOptionalSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: string
) {
  const trimmed = value.trim()

  if (trimmed) {
    searchParams.set(key, trimmed)
    return
  }

  searchParams.delete(key)
}

function createSectionResponse(
  content: CmsContent,
  section: AdminContentSection,
  searchParams: URLSearchParams
) {
  const responseContent: Partial<CmsContent> = {
    siteSettings: content.siteSettings,
    updatedAt: content.updatedAt,
    version: content.version,
  }
  if (section === "shell" || section === "account" || section === "customers") {
    return {
      content: responseContent,
    }
  }

  if (section === "dashboard") {
    return { content: responseContent }
  }

  if (section === "orders") {
    const filteredOrders = filterPaymentOrders(
      content.paymentOrders,
      searchParams
    )
    const pagination = createPagination(filteredOrders.length, searchParams, 10)

    return {
      content: {
        ...responseContent,
        bookingConfigs: content.bookingConfigs,
        formulaTemplates: content.formulaTemplates,
        paymentOrders: filteredOrders.slice(
          pagination.startIndex,
          pagination.endIndex
        ),
        serviceLocations: content.serviceLocations,
        serviceRegions: content.serviceRegions,
        salesMembers: content.salesMembers,
        teamMembers: content.teamMembers,
      },
      auntieStats: createAuntieStatsMap(
        content.paymentOrders,
        content.teamMembers
      ),
      pagination: toPublicPagination(pagination),
    }
  }

  if (section === "blogs") {
    const sortedPosts = [...content.blogPosts].sort(
      (a, b) => a.sortOrder - b.sortOrder
    )
    const filteredPosts = filterBlogPosts(sortedPosts, searchParams)
    const pagination = createPagination(filteredPosts.length, searchParams, 10)
    return {
      content: {
        ...responseContent,
        blogCategories: content.blogCategories,
        blogPosts: filteredPosts.slice(
          pagination.startIndex,
          pagination.endIndex
        ),
      },
      pagination: toPublicPagination(pagination),
    }
  }

  if (section === "categories") {
    return {
      content: {
        ...responseContent,
        blogCategories: content.blogCategories,
        blogPosts: content.blogPosts,
      },
    }
  }

  if (section === "gallery") {
    return {
      content: {
        ...responseContent,
        galleryItems: content.galleryItems,
      },
    }
  }

  if (section === "reviews") {
    return {
      content: {
        ...responseContent,
        reviewItems: content.reviewItems,
      },
    }
  }

  if (section === "faq") {
    return {
      content: {
        ...responseContent,
        faq: content.faq,
      },
    }
  }

  if (section === "serviceAreas") {
    return {
      content: {
        ...responseContent,
        bookingConfigs: content.bookingConfigs,
        serviceRegions: content.serviceRegions,
        serviceLocations: content.serviceLocations,
      },
    }
  }

  if (section === "services") {
    return {
      content: {
        ...responseContent,
        bookingConfigs: content.bookingConfigs,
        serviceLocations: content.serviceLocations,
      },
    }
  }

  if (section === "aunties") {
    const sortedMembers = [...content.teamMembers].sort((a, b) =>
      a.name.localeCompare(b.name, "zh-CN")
    )
    const filteredMembers = filterTeamMembers(sortedMembers, searchParams)
    const pagination = createPagination(
      filteredMembers.length,
      searchParams,
      10
    )
    return {
      content: {
        ...responseContent,
        teamMembers: filteredMembers.slice(
          pagination.startIndex,
          pagination.endIndex
        ),
      },
      auntieStats: createAuntieStatsMap(
        content.paymentOrders,
        content.teamMembers
      ),
      pagination: toPublicPagination(pagination),
    }
  }

  if (section === "siteSettings") {
    return {
      content: {
        ...responseContent,
        afterSalesPage: content.afterSalesPage,
        contactPage: content.contactPage,
        notificationSettings: content.notificationSettings,
        siteSettings: content.siteSettings,
      },
    }
  }

  return {
    content: {
      ...responseContent,
      paymentSettings: content.paymentSettings,
    },
  }
}

function filterPaymentOrders(
  orders: CmsPaymentOrder[],
  searchParams: URLSearchParams
) {
  const query = searchParams.get("query")?.trim().toLowerCase() ?? ""
  const status = searchParams.get("status")?.trim() ?? "all"

  return [...orders]
    .filter((order) => {
      const matchesStatus = status === "all" || order.status === status
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

      return matchesStatus && (!query || searchable.includes(query))
    })
    .sort((left, right) => getOrderTimestamp(right) - getOrderTimestamp(left))
}

function filterBlogPosts(
  posts: CmsContent["blogPosts"],
  searchParams: URLSearchParams
) {
  const query = searchParams.get("query")?.trim().toLowerCase() ?? ""
  const status = searchParams.get("status")?.trim() ?? "all"
  const category = searchParams.get("category")?.trim() ?? "all"

  return posts.filter((post) => {
    const matchesStatus = status === "all" || post.status === status
    const matchesCategory = category === "all" || post.category === category
    const searchable = [post.title, post.category, post.description]
      .join(" ")
      .toLowerCase()

    return (
      matchesStatus && matchesCategory && (!query || searchable.includes(query))
    )
  })
}

function filterTeamMembers(
  members: CmsContent["teamMembers"],
  searchParams: URLSearchParams
) {
  const query = searchParams.get("query")?.trim().toLowerCase() ?? ""
  const status = searchParams.get("status")?.trim() ?? "all"

  return members.filter((member) => {
    const matchesStatus = status === "all" || member.status === status
    const searchable = [
      member.name,
      member.phone ?? "",
      member.role,
      member.area,
      ...(member.serviceAreas ?? []),
    ]
      .join(" ")
      .toLowerCase()

    return matchesStatus && (!query || searchable.includes(query))
  })
}

function createPagination(
  totalCount: number,
  searchParams: URLSearchParams,
  fallbackPageSize: number
) {
  const pageSize = clampNumber(
    Number(searchParams.get("pageSize")),
    1,
    100,
    fallbackPageSize
  )
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = clampNumber(Number(searchParams.get("page")), 1, totalPages, 1)
  const startIndex = totalCount ? (page - 1) * pageSize : 0
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  return {
    endIndex,
    page,
    pageSize,
    startIndex,
    totalCount,
    totalPages,
  }
}

function toPublicPagination(pagination: ReturnType<typeof createPagination>) {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalCount: pagination.totalCount,
    totalPages: pagination.totalPages,
  }
}

function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number
) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Math.max(Math.trunc(value), min), max)
}

function getOrderTimestamp(order: CmsPaymentOrder) {
  const rawDate = order.createdAt || order.updatedAt || order.serviceDate
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0

  return Number.isFinite(timestamp) ? timestamp : 0
}

function upsertPaymentOrder(content: CmsContent, order: CmsPaymentOrder) {
  return {
    ...content,
    paymentOrders: upsertPaymentOrderInCollection(content.paymentOrders, order),
  }
}

function deletePaymentOrder(content: CmsContent, orderId: string) {
  return {
    ...content,
    paymentOrders: deletePaymentOrderFromCollection(
      content.paymentOrders,
      orderId
    ),
  }
}

function mergeById<T extends { id: string }>(current: T[], patched: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]))
  for (const item of patched) {
    map.set(item.id, item)
  }
  return Array.from(map.values())
}

function applySectionPatch(
  current: CmsContent,
  section: AdminContentSection,
  content: Partial<CmsContent>
): CmsContent {
  if (section === "blogs") {
    return {
      ...current,
      blogCategories: content.blogCategories ?? current.blogCategories,
      blogPosts: content.blogPosts
        ? mergeById(current.blogPosts, content.blogPosts)
        : current.blogPosts,
    }
  }

  if (section === "categories") {
    return {
      ...current,
      blogCategories: content.blogCategories ?? current.blogCategories,
      blogPosts: content.blogPosts ?? current.blogPosts,
    }
  }

  if (section === "gallery") {
    return {
      ...current,
      galleryItems: content.galleryItems ?? current.galleryItems,
    }
  }

  if (section === "reviews") {
    return {
      ...current,
      reviewItems: content.reviewItems ?? current.reviewItems,
    }
  }

  if (section === "faq") {
    return {
      ...current,
      faq: content.faq ?? current.faq,
    }
  }

  if (section === "aunties") {
    const teamMembers = content.teamMembers
      ? mergeById(current.teamMembers, content.teamMembers)
      : current.teamMembers
    const financialContent = {
      formulaTemplates: current.formulaTemplates,
      salesMembers: current.salesMembers,
      teamMembers,
    }

    return {
      ...current,
      paymentOrders: current.paymentOrders.map((order) =>
        order.status === "paid"
          ? calculateOrderFinancialsSafely(order, financialContent)
          : order
      ),
      teamMembers,
    }
  }

  if (section === "serviceAreas") {
    return {
      ...current,
      bookingConfigs: content.bookingConfigs ?? current.bookingConfigs,
      serviceRegions: content.serviceRegions ?? current.serviceRegions,
      serviceLocations: content.serviceLocations ?? current.serviceLocations,
    }
  }

  if (section === "services") {
    return {
      ...current,
      bookingConfigs: content.bookingConfigs ?? current.bookingConfigs,
    }
  }

  if (section === "siteSettings") {
    return {
      ...current,
      afterSalesPage: content.afterSalesPage ?? current.afterSalesPage,
      contactPage: content.contactPage ?? current.contactPage,
      notificationSettings:
        content.notificationSettings ?? current.notificationSettings,
      siteSettings: content.siteSettings ?? current.siteSettings,
    }
  }

  if (section === "paymentSettings") {
    return {
      ...current,
      paymentSettings: content.paymentSettings ?? current.paymentSettings,
    }
  }

  return current
}
