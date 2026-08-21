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
  detailSrc?: string
  id: string
  sortOrder: number
  src: string
  status: CmsStatus
  thumbnailSrc?: string
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
  | "awaiting_confirmation"
  | "cancelled"
  | "failed"
  | "paid"
  | "pending"
  | "unpaid"

type CmsPaymentOrderAmountItem = {
  amount: number
  label: string
}

type CmsPaymentProof = {
  dataUrl: string
  fileName: string
  mimeType: string
  uploadedAt: string
}

type CmsBookingQuantityPrice = {
  amount: number
  quantity: number
}

type CmsBookingCatalogItem = {
  basePrice: number
  bathroomPrices?: CmsBookingQuantityPrice[]
  bedroomPrices?: CmsBookingQuantityPrice[]
  description: string
  enabled: boolean
  id: string
  label: string
  quoteRequired?: boolean
  studioPrice?: number
  type: "addon" | "service"
}

type CmsBookingLocationConfig = {
  currency: string
  items: CmsBookingCatalogItem[]
  locationId: string
}

type CmsOrderAddOnItem = {
  id: string
  label: string
  price: number
  quoteRequired?: boolean
}

type CmsFormulaTarget = "orderProfit"

type CmsFormulaField =
  | "auntieSalary"
  | "otherCost"
  | "paymentAmount"
  | "receivedAmount"
  | "salesCommission"

type CmsFormulaToken =
  | { type: "field"; value: CmsFormulaField }
  | { type: "number"; value: number }
  | { type: "operator"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" }
  | { type: "percent"; value: number }

type CmsFormulaTemplate = {
  createdAt: string
  enabled: boolean
  id: string
  name: string
  target: CmsFormulaTarget
  tokens: CmsFormulaToken[]
  updatedAt: string
  version: number
}

type CmsOrderCalculationSnapshot = {
  calculatedAt: string
  formulaVersions: Partial<
    Record<CmsFormulaTarget, { id: string; name: string; version: number }>
  >
  inputs: {
    auntieSalary: number
    otherCost: number
    paymentAmount: number
    receivedAmount: number
    salesCommission: number
    serviceDurationHours?: number
  }
}

type CmsPaymentOrder = {
  airwallexPaymentIntentClientSecret?: string
  airwallexPaymentIntentId?: string
  airwallexPaymentLinkId?: string
  airwallexPaymentUrl?: string
  amount: string
  amountBreakdown?: CmsPaymentOrderAmountItem[]
  amountValue?: number
  addOnItems?: CmsOrderAddOnItem[]
  addOnOther?: string
  assignedAuntieId?: string
  auntieSalary?: number
  bathrooms?: number
  baseAmountValue?: number
  bedrooms?: number
  contact: string
  createdAt: string
  currency?: string
  customerRelationId?: string
  customerType?: string
  customerName: string
  dealStatus?: "converted" | "unconverted"
  estimatedAmountValue?: number
  estimatedCurrency?: string
  failureReason?: string
  gatewayStatus?: string
  hasPets?: boolean
  financeNote?: string
  formulaTemplateIds?: Partial<Record<CmsFormulaTarget, string>>
  calculationSnapshot?: CmsOrderCalculationSnapshot
  note: string
  orderId: string
  orderProfit?: number
  orderProfitCny?: number
  otherCost?: number
  paidAt?: string
  paymentExpiresAt?: string
  provider?: "airwallex" | "offline"
  profitExchangeRateAt?: string
  profitExchangeRateToCny?: number
  receivedAmount?: number
  review?: CmsOrderReview
  salesCommission?: number
  salesMemberId?: string
  salesOwner?: string
  salesOwnerSource?: "manual" | "wecom_member" | "wecom_tag"
  serviceAddress: string
  serviceArea: string
  serviceDate: string
  serviceDurationHours?: number
  serviceType: string
  serviceTypeId?: string
  status: CmsPaymentOrderStatus
  studio?: boolean
  tipAmount?: number
  zellePaymentProof?: CmsPaymentProof
  supportPaymentProof?: CmsPaymentProof
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
  authVersion?: number
  passwordHash: string
  username: string
}

type CmsTeamMemberStatus = "available" | "on-task" | "off-duty" | "on-leave"
type CmsAuntieSalaryMode = "hourly" | "percentage"

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
  /** Legacy field migrated to a negative salaryAdjustment at runtime. */
  salaryDeduction?: number
  salaryAdjustment?: number
  salaryHourlyRate?: number
  salaryMode?: CmsAuntieSalaryMode
  salaryPercentage?: number
}

type CmsSalesMemberStatus = "active" | "inactive"

type CmsSalesMember = {
  accountUsername?: string
  authVersion?: number
  commissionAdjustment?: number
  commissionPercentage: number
  createdAt: string
  id: string
  name: string
  passwordHash?: string
  status: CmsSalesMemberStatus
  studentTag: string
  updatedAt: string
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
  bookingConfigs: CmsBookingLocationConfig[]
  contactPage: Record<Language, CmsContactPageContent>
  dashboardTasks: CmsDashboardTask[]
  faq: Record<Language, CmsFaqContent>
  formulaTemplates: CmsFormulaTemplate[]
  galleryItems: CmsGalleryItem[]
  notificationSettings: CmsNotificationSettings
  paymentOrders: CmsPaymentOrder[]
  paymentSettings: CmsPaymentSettings
  reviewItems: CmsGalleryItem[]
  salesMembers: CmsSalesMember[]
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
  CmsAuntieSalaryMode,
  CmsBlogCategory,
  CmsBlogPost,
  CmsBookingCatalogItem,
  CmsBookingLocationConfig,
  CmsBookingQuantityPrice,
  CmsContactMethod,
  CmsContactPageContent,
  CmsContent,
  CmsDashboardTask,
  CmsDashboardTaskPriority,
  CmsDashboardTaskStatus,
  CmsFaqContent,
  CmsFaqItem,
  CmsFormulaField,
  CmsFormulaTarget,
  CmsFormulaTemplate,
  CmsFormulaToken,
  CmsGalleryItem,
  CmsNotificationSettings,
  CmsOrderAddOnItem,
  CmsOrderCalculationSnapshot,
  CmsOrderReview,
  CmsPaymentOrder,
  CmsPaymentOrderAmountItem,
  CmsPaymentProof,
  CmsPaymentOrderStatus,
  CmsPaymentSettings,
  CmsServiceLocation,
  CmsServiceRegion,
  CmsSalesMember,
  CmsSalesMemberStatus,
  CmsSiteSettings,
  CmsStatus,
  CmsTeamMember,
  CmsTeamMemberStatus,
}
