import type { Language } from "@/lib/i18n"

type CmsStatus = "draft" | "published"

type CmsBlogPost = {
  category: string
  content: string
  description: string
  id: string
  image: string
  imagePosition?: string
  publishedAt?: string
  readTime: string
  slug: string
  sortOrder: number
  status: CmsStatus
  title: string
}

type CmsBlogCategory = {
  id: string
  label: string
  sortOrder: number
}

type CmsGalleryItem = {
  id: string
  sortOrder: number
  src: string
  status: CmsStatus
}

type CmsContactMethod = {
  id: string
  label: string
  text: string
}

type CmsContactPageContent = {
  company: string
  contactEmail: string
  contactPhone: string
  contactTitle: string
  heroDescription: string
  heroTitle: string
  kicker: string
  methods: CmsContactMethod[]
  qrDescription: string
  qrImage: string
  qrTitle: string
  serviceArea: string
  serviceAreaText: string
}

type CmsAfterSalesQrItem = {
  id: string
  label: string
  src: string
}

type CmsAfterSalesPageContent = {
  contactDescription: string
  contactTitle: string
  qrDescription: string
  qrItems: CmsAfterSalesQrItem[]
  qrTitle: string
  responseMeta: string
}

type CmsFaqItem = {
  answer: string[]
  id: string
  question: string
  sortOrder: number
  status: CmsStatus
}

type CmsFaqContent = {
  description: string
  intro: string[]
  introLabel: string
  items: CmsFaqItem[]
  kicker: string
  navLabel: string
  title: string
}

type CmsPaymentSettings = {
  currency: string
  enabled: boolean
  provider: "airwallex"
}

type CmsPaymentOrderStatus =
  "cancelled" | "failed" | "paid" | "pending" | "unpaid"

type CmsPaymentOrder = {
  airwallexPaymentIntentClientSecret?: string
  airwallexPaymentIntentId?: string
  airwallexPaymentLinkId?: string
  airwallexPaymentUrl?: string
  amount: string
  amountValue?: number
  assignedAuntieId?: string
  contact: string
  createdAt: string
  currency?: string
  customerName: string
  failureReason?: string
  gatewayStatus?: string
  note: string
  orderId: string
  paidAt?: string
  provider?: "airwallex"
  review?: CmsOrderReview
  serviceAddress: string
  serviceArea: string
  serviceDate: string
  serviceType: string
  status: CmsPaymentOrderStatus
  updatedAt: string
  webhookEventIds?: string[]
}

type CmsOrderReview = {
  comment: string
  createdAt: string
  customerName: string
  rating: number
}

type CmsNotificationSettings = {
  recipientEmail: string
  smtpFrom: string
  smtpHost: string
  smtpPassword: string
  smtpPort: string
  smtpSecure: boolean
  smtpUsername: string
}

type CmsSiteSettings = {
  logoImage: string
}

type CmsAdminSettings = {
  passwordHash: string
  username: string
}

type CmsTeamMemberStatus = "available" | "on-task" | "off-duty" | "on-leave"

type CmsTeamMember = {
  id: string
  name: string
  avatar: string
  avatarThumb?: string
  role: string
  status: CmsTeamMemberStatus
  currentOrder?: string
  area: string
  completedCount: number
  rating: number
  phone?: string
  joinedAt?: string
  serviceAreas?: string[]
}

type CmsDashboardTaskPriority = "high" | "medium" | "low"
type CmsDashboardTaskStatus = "pending" | "in-progress" | "completed"

type CmsDashboardTask = {
  id: string
  title: string
  description: string
  priority: CmsDashboardTaskPriority
  status: CmsDashboardTaskStatus
  dueDate: string
  assignee: string
  relatedOrderId?: string
  createdAt: string
}

// 服务区域：国家/地区。id 为 ISO_A3（如 USA/GBR），与 public/data/countries.geojson
// 的 ISO_A3/ADM0_A3 字段匹配，决定 3D 地球轮廓高亮。后台不可编辑该 id。
// cities 不再由后台维护，统一由 serviceLocations 按 country 聚合派生
// （见 lib/service-regions.ts 的 regionsWithDerivedCities）。保留该字段仅为兼容旧消费方。
type CmsServiceRegion = {
  id: string
  name: string
  code2: string
  latitude: number
  longitude: number
  cities: string[]
  isTiny?: boolean
}

// 服务区域：城市服务点。id 为后台自动生成的 nanoid（不进 URL），用于 3D 地球标记。
// option 字符串格式 `${city} · ${country}` 被订单/预约/阿姨引用，不可变更。
type CmsServiceLocation = {
  id: string
  city: string
  country: string
  label: string
  latitude: number
  longitude: number
}

type CmsContent = {
  adminSettings?: CmsAdminSettings
  afterSalesPage: Record<Language, CmsAfterSalesPageContent>
  blogCategories: CmsBlogCategory[]
  blogPosts: CmsBlogPost[]
  contactPage: Record<Language, CmsContactPageContent>
  dashboardTasks: CmsDashboardTask[]
  faq: Record<Language, CmsFaqContent>
  galleryItems: CmsGalleryItem[]
  notificationSettings: CmsNotificationSettings
  paymentOrders: CmsPaymentOrder[]
  paymentSettings: CmsPaymentSettings
  reviewItems: CmsGalleryItem[]
  serviceRegions: CmsServiceRegion[]
  serviceLocations: CmsServiceLocation[]
  siteSettings: CmsSiteSettings
  teamMembers: CmsTeamMember[]
  updatedAt: string
  version: number
}

export type {
  CmsAfterSalesPageContent,
  CmsAfterSalesQrItem,
  CmsAdminSettings,
  CmsBlogCategory,
  CmsBlogPost,
  CmsContactMethod,
  CmsContactPageContent,
  CmsContent,
  CmsOrderReview,
  CmsDashboardTask,
  CmsDashboardTaskPriority,
  CmsDashboardTaskStatus,
  CmsFaqContent,
  CmsFaqItem,
  CmsGalleryItem,
  CmsNotificationSettings,
  CmsPaymentOrder,
  CmsPaymentOrderStatus,
  CmsPaymentSettings,
  CmsServiceLocation,
  CmsServiceRegion,
  CmsSiteSettings,
  CmsStatus,
  CmsTeamMember,
  CmsTeamMemberStatus,
}
