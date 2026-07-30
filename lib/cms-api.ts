import type { CmsContent, CmsPaymentOrder, CmsTeamMember } from "@/types/cms"
import type { AuntieAssignmentMode } from "@/lib/auntie-assignment"
import type {
  AdminAuntieStatsMap,
  AdminDashboardSummary,
} from "@/lib/admin-analytics"

const ADMIN_TOKEN_KEY = "auntie-chen-admin-token"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

class ApiRequestError extends Error {
  readonly code?: string
  readonly status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = code
  }
}

type AdminLoginResult = {
  token: string
  user: {
    username: string
  }
}

type UploadCollection = "blog" | "gallery" | "pages" | "reviews"
type AdminContentSection =
  | "account"
  | "aunties"
  | "blogs"
  | "categories"
  | "dashboard"
  | "faq"
  | "gallery"
  | "orders"
  | "paymentSettings"
  | "reviews"
  | "serviceAreas"
  | "shell"
  | "siteSettings"

type AdminContentSectionParams = {
  category?: string
  chartRange?: number
  dashboardParts?: "chart"
  page?: number
  pageSize?: number
  query?: string
  section: AdminContentSection
  status?: string
}

type AdminContentPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

type AdminContentSectionResult = {
  auntieStats?: AdminAuntieStatsMap
  content: Partial<CmsContent>
  dashboardSummary?: AdminDashboardSummary
  pagination?: AdminContentPagination
}

type UploadResult = {
  filename: string
  size: number
  src: string
  thumbSrc: string | null
  type: string
}

type AdminPaymentRuntimeConfig = {
  airwallex: {
    accountIdConfigured: boolean
    apiBaseUrl: string
    apiKeyConfigured: boolean
    clientIdConfigured: boolean
    configured: boolean
    environment: "demo" | "production"
    environmentConfigured: boolean
    webhookSecretConfigured: boolean
    webhookSecretSource: "env" | "missing"
    webhookUrl: string
  }
}

type PublicContentSection =
  | "afterSalesPage"
  | "blogCategories"
  | "blogPosts"
  | "contactPage"
  | "faq"
  | "galleryItems"
  | "paymentSettings"
  | "reviewItems"
  | "serviceLocations"
  | "serviceRegions"
  | "siteSettings"

type PublicFormType = "estimate" | "join"
type PublicFormPayload = Record<string, boolean | string | string[]>
type BookingOrderPayload = {
  amount: string
  assignedAuntieId?: string
  assignmentMode?: AuntieAssignmentMode
  bathrooms: string
  bedrooms: string
  contact: string
  customerName: string
  note: string
  priceEstimate: string
  serviceAddress: string
  serviceArea: string
  serviceDate: string
  serviceType: string
}

async function fetchPublicContent(
  sections: PublicContentSection[]
): Promise<Partial<CmsContent>>
async function fetchPublicContent(sections: PublicContentSection[]) {
  const query = `?sections=${encodeURIComponent(sections.join(","))}`
  return request<CmsContent>(`/api/content${query}`)
}

async function fetchPaymentOrder(orderId: string) {
  return request<CmsPaymentOrder>(
    `/api/payment-orders/${encodeURIComponent(orderId)}`
  )
}

async function fetchFeaturedAunties() {
  return request<CmsTeamMember[]>("/api/aunties/featured")
}

async function fetchPublicAuntie(auntieId: string) {
  return request<CmsTeamMember>(`/api/aunties/${encodeURIComponent(auntieId)}`)
}

async function loginAdmin(username: string, password: string) {
  return request<AdminLoginResult>("/api/admin/login", {
    body: JSON.stringify({ username, password }),
    method: "POST",
  })
}

async function fetchAdminContent(token: string) {
  return request<CmsContent>("/api/admin/content", {
    headers: createAuthHeaders(token),
  })
}

async function fetchAdminSectionContent(
  token: string,
  params: AdminContentSectionParams
) {
  return request<AdminContentSectionResult>(
    `/api/admin/content?${createAdminContentQuery(params)}`,
    {
      headers: createAuthHeaders(token),
    }
  )
}

async function fetchAdminPaymentRuntimeConfig(token: string) {
  return request<AdminPaymentRuntimeConfig>("/api/admin/payment-runtime", {
    headers: createAuthHeaders(token),
  })
}

async function saveAdminContent(token: string, content: CmsContent) {
  return request<CmsContent>("/api/admin/content", {
    body: JSON.stringify(content),
    headers: createAuthHeaders(token),
    method: "PUT",
  })
}

async function saveAdminContentSection(
  token: string,
  section: AdminContentSection,
  content: Partial<CmsContent>,
  params?: Omit<AdminContentSectionParams, "section">
) {
  return request<AdminContentSectionResult>("/api/admin/content", {
    body: JSON.stringify({
      content,
      params: params ? { ...params, section } : { section },
      section,
    }),
    headers: createAuthHeaders(token),
    method: "PATCH",
  })
}

async function upsertAdminPaymentOrder(
  token: string,
  order: CmsPaymentOrder,
  params?: Omit<AdminContentSectionParams, "section">
) {
  return request<AdminContentSectionResult>("/api/admin/content", {
    body: JSON.stringify({
      action: "upsert-order",
      order,
      params: params ? { ...params, section: "orders" } : { section: "orders" },
      section: "orders",
    }),
    headers: createAuthHeaders(token),
    method: "PATCH",
  })
}

async function deleteAdminPaymentOrder(
  token: string,
  orderId: string,
  params?: Omit<AdminContentSectionParams, "section">
) {
  return request<AdminContentSectionResult>("/api/admin/content", {
    body: JSON.stringify({
      action: "delete-order",
      orderId,
      params: params ? { ...params, section: "orders" } : { section: "orders" },
      section: "orders",
    }),
    headers: createAuthHeaders(token),
    method: "PATCH",
  })
}

type AuntieReviewItem = {
  orderId: string
  serviceType: string
  serviceDate: string
  serviceArea: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

type AuntieReviewPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

type PublicAuntieReviewItem = Omit<AuntieReviewItem, "orderId">

type PublicAuntieReviewsResult = {
  auntie: Pick<
    CmsTeamMember,
    | "avatar"
    | "avatarThumb"
    | "completedCount"
    | "id"
    | "name"
    | "rating"
    | "role"
    | "status"
  >
  pagination: AuntieReviewPagination
  reviews: PublicAuntieReviewItem[]
}

type AuntieDetail = CmsTeamMember & {
  activeAssignedCount: number
  avgRating: number
  completedCount: number
  reviewCount: number
  reviews?: AuntieReviewItem[]
  reviewPagination?: AuntieReviewPagination
}

async function fetchAuntieDetail(
  token: string,
  auntieId: string,
  params?: { page?: number; pageSize?: number; reviews?: boolean }
) {
  const query = new URLSearchParams()
  if (params?.reviews) {
    query.set("reviews", "1")
  }
  if (params?.page) {
    query.set("page", String(params.page))
  }
  if (params?.pageSize) {
    query.set("pageSize", String(params.pageSize))
  }
  const qs = query.toString()
  return request<AuntieDetail>(
    `/api/admin/aunties/${encodeURIComponent(auntieId)}${qs ? `?${qs}` : ""}`,
    {
      headers: createAuthHeaders(token),
    }
  )
}

async function fetchAuntiesByArea(area: string) {
  return request<CmsTeamMember[]>(
    `/api/aunties?area=${encodeURIComponent(area)}`
  )
}

async function fetchPublicAuntieReviews(
  auntieId: string,
  params?: { page?: number; pageSize?: number }
) {
  const query = new URLSearchParams()
  if (params?.page) {
    query.set("page", String(params.page))
  }
  if (params?.pageSize) {
    query.set("pageSize", String(params.pageSize))
  }
  const qs = query.toString()

  return request<PublicAuntieReviewsResult>(
    `/api/aunties/${encodeURIComponent(auntieId)}/reviews${qs ? `?${qs}` : ""}`
  )
}

async function deleteAdminAuntie(
  token: string,
  auntieId: string,
  params?: Omit<AdminContentSectionParams, "section">
) {
  return request<AdminContentSectionResult>("/api/admin/content", {
    body: JSON.stringify({
      action: "delete-member",
      memberId: auntieId,
      params: params
        ? { ...params, section: "aunties" }
        : { section: "aunties" },
      section: "aunties",
    }),
    headers: createAuthHeaders(token),
    method: "PATCH",
  })
}

async function deleteAdminBlogPosts(
  token: string,
  postIds: string[],
  params?: Omit<AdminContentSectionParams, "section">
) {
  return request<AdminContentSectionResult>("/api/admin/content", {
    body: JSON.stringify({
      action: "delete-post",
      params: params ? { ...params, section: "blogs" } : { section: "blogs" },
      postIds,
      section: "blogs",
    }),
    headers: createAuthHeaders(token),
    method: "PATCH",
  })
}

async function updateAdminPassword(
  token: string,
  payload: {
    currentPassword: string
    newPassword: string
  }
) {
  return request<{ ok: boolean }>("/api/admin/password", {
    body: JSON.stringify(payload),
    headers: createAuthHeaders(token),
    method: "POST",
  })
}

async function uploadAdminImage(
  token: string,
  collection: UploadCollection,
  file: File
) {
  const formData = new FormData()
  formData.append("file", file)

  return uploadRequest<UploadResult>(`/api/admin/uploads/${collection}`, {
    body: formData,
    headers: createAuthHeaders(token),
    method: "POST",
  })
}

async function submitPublicForm(
  type: PublicFormType,
  payload: PublicFormPayload
) {
  return request<{ ok: boolean }>(`/api/forms/${type}`, {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

async function createBookingPaymentOrder(payload: BookingOrderPayload) {
  return request<{ order: CmsPaymentOrder; paymentPath: string }>(
    "/api/bookings",
    {
      body: JSON.stringify(payload),
      method: "POST",
    }
  )
}

async function startPaymentOrderCheckout(orderId: string, tipAmount = 0) {
  return request<{
    order: CmsPaymentOrder
    paymentIntent: {
      amount: number
      clientSecret: string
      currency: string
      environment: "demo" | "prod"
      id: string
    } | null
  }>(`/api/payment-orders/${encodeURIComponent(orderId)}/checkout`, {
    body: JSON.stringify({ tipAmount }),
    method: "POST",
  })
}

async function syncPaymentOrder(orderId: string) {
  return request<{
    ok: boolean
    order: CmsPaymentOrder
    synced: boolean
  }>(`/api/payment-orders/${encodeURIComponent(orderId)}/sync`, {
    method: "POST",
  })
}

async function confirmPaymentOrder(orderId: string) {
  return request<{
    notificationSent: boolean
    ok: boolean
    order: CmsPaymentOrder
  }>(`/api/payment-orders/${encodeURIComponent(orderId)}/pay`, {
    method: "POST",
  })
}

async function submitOrderReview(
  orderId: string,
  rating: number,
  comment: string
) {
  return request<{
    ok: boolean
    order: CmsPaymentOrder
  }>(`/api/payment-orders/${encodeURIComponent(orderId)}/review`, {
    body: JSON.stringify({ rating, comment }),
    method: "POST",
  })
}

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(ADMIN_TOKEN_KEY)
}

function setStoredAdminToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

function clearStoredAdminToken() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function request<TResponse>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw createApiRequestError(data, response.status, "Request failed")
  }

  return data as TResponse
}

async function uploadRequest<TResponse>(
  path: string,
  init: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw createApiRequestError(data, response.status, "Upload failed")
  }

  return data as TResponse
}

function createApiRequestError(
  data: unknown,
  status: number,
  fallbackMessage: string
) {
  const payload =
    data && typeof data === "object"
      ? (data as { error?: unknown; message?: unknown })
      : null
  const message =
    typeof payload?.message === "string" ? payload.message : fallbackMessage
  const code = typeof payload?.error === "string" ? payload.error : undefined

  return new ApiRequestError(message, status, code)
}

function isApiRequestError(error: unknown, status?: number) {
  return (
    error instanceof ApiRequestError &&
    (status === undefined || error.status === status)
  )
}

function createAuthHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
  }
}

function createAdminContentQuery(params: AdminContentSectionParams) {
  const searchParams = new URLSearchParams()
  searchParams.set("section", params.section)

  if (params.page) {
    searchParams.set("page", String(params.page))
  }

  if (params.pageSize) {
    searchParams.set("pageSize", String(params.pageSize))
  }

  if (params.query?.trim()) {
    searchParams.set("query", params.query.trim())
  }

  if (params.status?.trim()) {
    searchParams.set("status", params.status.trim())
  }

  if (params.category?.trim()) {
    searchParams.set("category", params.category.trim())
  }

  if (params.chartRange) {
    searchParams.set("chartRange", String(params.chartRange))
  }

  if (params.dashboardParts) {
    searchParams.set("dashboardParts", params.dashboardParts)
  }

  return searchParams.toString()
}

export {
  ApiRequestError,
  clearStoredAdminToken,
  confirmPaymentOrder,
  createBookingPaymentOrder,
  deleteAdminAuntie,
  deleteAdminBlogPosts,
  deleteAdminPaymentOrder,
  fetchAdminContent,
  fetchAdminPaymentRuntimeConfig,
  fetchAdminSectionContent,
  fetchAuntieDetail,
  fetchAuntiesByArea,
  fetchFeaturedAunties,
  fetchPaymentOrder,
  fetchPublicAuntie,
  fetchPublicAuntieReviews,
  fetchPublicContent,
  getStoredAdminToken,
  isApiRequestError,
  loginAdmin,
  saveAdminContent,
  saveAdminContentSection,
  setStoredAdminToken,
  startPaymentOrderCheckout,
  syncPaymentOrder,
  submitOrderReview,
  submitPublicForm,
  upsertAdminPaymentOrder,
  uploadAdminImage,
  updateAdminPassword,
}

export type {
  AdminContentPagination,
  AdminContentSection,
  AdminContentSectionParams,
  AdminContentSectionResult,
  AdminAuntieStatsMap,
  AdminDashboardSummary,
  AdminPaymentRuntimeConfig,
  AuntieDetail,
  AuntieReviewItem,
  AuntieReviewPagination,
  PublicAuntieReviewItem,
  PublicAuntieReviewsResult,
  BookingOrderPayload,
  PublicContentSection,
  PublicFormPayload,
  PublicFormType,
  UploadCollection,
  UploadResult,
}
