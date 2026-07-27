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
  "cancelled" | "failed" | "paid" | "pending" | "unpaid"

type CmsPaymentOrderAmountItem = {
  amount: number
  label: string
}

type CmsPaymentOrder = {
  airwallexPaymentIntentClientSecret?: string
  airwallexPaymentIntentId?: string
  airwallexPaymentLinkId?: string
  airwallexPaymentUrl?: string
  amount: string
  amountBreakdown?: CmsPaymentOrderAmountItem[]
  amountValue?: number
  baseAmountValue?: number
  contact: string
  createdAt: string
  currency?: string
  customerName: string
  failureReason?: string
  gatewayStatus?: string
  note: string
  orderId: string
  paidAt?: string
  paymentExpiresAt?: string
  provider?: "airwallex"
  serviceAddress: string
  serviceArea: string
  serviceDate: string
  serviceType: string
  status: CmsPaymentOrderStatus
  tipAmount?: number
  updatedAt: string
  webhookEventIds?: string[]
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

type CmsContent = {
  adminSettings?: CmsAdminSettings
  afterSalesPage: Record<Language, CmsAfterSalesPageContent>
  blogCategories: CmsBlogCategory[]
  blogPosts: CmsBlogPost[]
  contactPage: Record<Language, CmsContactPageContent>
  faq: Record<Language, CmsFaqContent>
  galleryItems: CmsGalleryItem[]
  notificationSettings: CmsNotificationSettings
  paymentOrders: CmsPaymentOrder[]
  paymentSettings: CmsPaymentSettings
  reviewItems: CmsGalleryItem[]
  siteSettings: CmsSiteSettings
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
  CmsFaqContent,
  CmsFaqItem,
  CmsGalleryItem,
  CmsNotificationSettings,
  CmsPaymentOrder,
  CmsPaymentOrderAmountItem,
  CmsPaymentOrderStatus,
  CmsPaymentSettings,
  CmsSiteSettings,
  CmsStatus,
}
