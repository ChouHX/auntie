import { faqContent } from "@/data/faq"
import type {
  CmsAfterSalesPageContent,
  CmsBlogCategory,
  CmsBlogPost,
  CmsContactPageContent,
  CmsContent,
  CmsGalleryItem,
} from "@/types/cms"

import { companyIdentity } from "@/lib/company-identity"

const defaultBlogPosts: CmsBlogPost[] = [
  {
    id: "blog-regular-vs-deep-cleaning",
    category: "清洁指南",
    title: "日常保洁和深度保洁到底怎么选？",
    description:
      "从家庭卫生状态、厨房油污、浴室水垢和服务时长几个维度，判断本次预约更适合哪类清洁。",
    readTime: "5 分钟阅读",
    image: "/services/regular.jpg",
    slug: "regular-vs-deep-cleaning",
    content:
      "如果家里一直有定期打扫，可以选择日常保洁；如果厨房、浴室或死角较明显，建议选择深度保洁。",
    status: "published",
    sortOrder: 1,
  },
  {
    id: "blog-booking-confirmation-checklist",
    category: "服务标准",
    title: "一次稳定的上门服务，预约前需要确认什么？",
    description:
      "房型、面积、重点区域、可接单时间和特殊材质提前说清楚，可以明显减少现场误差。",
    readTime: "6 分钟阅读",
    image: "/about_us.png",
    slug: "booking-confirmation-checklist",
    content:
      "预约前确认服务类型、地址、重点区域、特殊材质和可预约时间，可以帮助客服更准确安排阿姨。",
    status: "published",
    sortOrder: 2,
  },
  {
    id: "blog-move-out-cleaning-details",
    category: "退租清洁",
    title: "退租前清洁有哪些容易忽略的细节？",
    description:
      "窗台、踢脚线、橱柜外部、浴室玻璃和厨房表面，是交房前更容易被检查到的位置。",
    readTime: "4 分钟阅读",
    image: "/services/move-out.jpg",
    slug: "move-out-cleaning-details",
    content:
      "退租清洁需要优先处理容易被检查的位置，并提前确认窗户、柜内和电器内部是否属于服务范围。",
    status: "published",
    sortOrder: 3,
  },
  {
    id: "blog-auntie-screening-process",
    category: "阿姨管理",
    title: "为什么我们坚持先筛选、试工再安排服务？",
    description:
      "家政服务不是临时派人，服务稳定性来自前期筛选、流程培训和后续客户反馈管理。",
    readTime: "7 分钟阅读",
    image: "/services/deep.jpg",
    slug: "auntie-screening-process",
    content:
      "阿姨进入服务名单前会经过沟通、面试、试工和流程培训，服务后也会持续跟进客户反馈。",
    status: "published",
    sortOrder: 4,
  },
  {
    id: "blog-post-renovation-cleaning-time",
    category: "开荒清洁",
    title: "装修后第一次清洁，需要预留更长时间",
    description:
      "开荒清洁通常涉及灰尘、胶印、窗槽和边角处理，现场复杂度会明显高于日常保洁。",
    readTime: "5 分钟阅读",
    image: "/services/post-renovation.jpg",
    slug: "post-renovation-cleaning-time",
    content:
      "开荒清洁通常比日常保洁更耗时，建议提前说明装修残留、玻璃、窗槽和胶印情况。",
    status: "published",
    sortOrder: 5,
  },
  {
    id: "blog-recurring-cleaning-benefits",
    category: "长期维护",
    title: "固定频率清洁为什么更适合海外华人家庭？",
    description:
      "固定服务能让阿姨更熟悉家庭习惯和重点区域，也让预约、验收和反馈更省心。",
    readTime: "6 分钟阅读",
    image: "/services/recurring.jpg",
    slug: "recurring-cleaning-benefits",
    content:
      "长期固定清洁可以降低每次沟通成本，也能让服务重点、家庭习惯和验收方式更稳定。",
    status: "published",
    sortOrder: 6,
  },
]

const defaultBlogCategories: CmsBlogCategory[] = [
  "清洁指南",
  "服务标准",
  "退租清洁",
  "阿姨管理",
  "开荒清洁",
  "长期维护",
].map((label, index) => ({
  id: `blog-category-${index + 1}`,
  label,
  sortOrder: index + 1,
}))

const defaultGalleryItems: CmsGalleryItem[] = [
  "/services/regular.jpg",
  "/services/deep.jpg",
  "/services/move-out.jpg",
  "/services/post-renovation.jpg",
  "/services/recurring.jpg",
  "/services/commercial.jpg",
].map((src, index) => ({
  id: `gallery-${index + 1}`,
  src,
  status: "published",
  sortOrder: index + 1,
}))

const defaultReviewItems: CmsGalleryItem[] = Array.from(
  { length: 35 },
  (_, index) => {
    const reviewNumber = index + 1
    const reviewId = String(reviewNumber).padStart(2, "0")
    const detailExtension = reviewNumber <= 25 ? "png" : "jpg"
    const thumbnailSrc = `/review-screenshots/display/review-${reviewId}.jpg`

    return {
      detailSrc: `/review-screenshots/review-${reviewId}.${detailExtension}`,
      id: `review-${reviewId}`,
      src: thumbnailSrc,
      status: "published",
      sortOrder: reviewNumber,
      thumbnailSrc,
    }
  }
)

const defaultContactPage: CmsContent["contactPage"] = {
  zh: {
    company: companyIdentity.legalName,
    contactEmail: companyIdentity.contactEmail,
    contactPhone: companyIdentity.contactPhone,
    contactTitle: "客服联系方式",
    heroDescription:
      "如有预约、售后、投诉或隐私相关问题，请通过以下方式联系我们。",
    heroTitle: "联系我们",
    kicker: "Contact Us",
    methods: [
      {
        id: "support-email",
        label: "客服邮箱",
        text: companyIdentity.contactEmail,
      },
      {
        id: "company",
        label: "公司名称",
        text: companyIdentity.legalName,
      },
    ],
    qrDescription: "建议优先通过邮箱联系；如有企业微信二维码，也可扫码添加。",
    qrImage: "/wechat_qrcode.jpg",
    qrTitle: "优先扫码联系",
    serviceArea: "服务地区",
    serviceAreaText:
      "美国、加拿大、澳洲、英国等海外华人城市，具体以客服确认为准。",
  },
  en: {
    company: companyIdentity.legalName,
    contactEmail: companyIdentity.contactEmail,
    contactPhone: companyIdentity.contactPhone,
    contactTitle: "Support Contacts",
    heroDescription:
      "For booking, after-service, complaints, or privacy questions, contact us through the channels below.",
    heroTitle: "Contact Us",
    kicker: "Contact Us",
    methods: [
      {
        id: "support-email",
        label: "Support email",
        text: companyIdentity.contactEmail,
      },
      {
        id: "company",
        label: "Company",
        text: companyIdentity.legalName,
      },
    ],
    qrDescription:
      "Please contact us by email first. If a WeCom QR code is available, you may also scan it.",
    qrImage: "/wechat_qrcode.jpg",
    qrTitle: "Scan First",
    serviceArea: "Service areas",
    serviceAreaText:
      "Chinese communities in the United States, Canada, Australia, the United Kingdom, and other supported cities, subject to support confirmation.",
  },
}

const defaultAfterSalesPage: CmsContent["afterSalesPage"] = {
  zh: {
    contactDescription: "有售后、投诉或建议问题，可以优先扫码添加微信联系。",
    contactTitle: "扫码联系售后",
    qrDescription: "有售后、投诉或建议问题，可以优先扫码添加微信联系。",
    qrItems: [
      {
        id: "support",
        label: "售后处理",
        src: "/after-sales/support-qr-1.jpg",
      },
      {
        id: "feedback",
        label: "投诉建议",
        src: "/after-sales/support-qr-2.jpg",
      },
    ],
    qrTitle: "扫码联系售后",
    responseMeta: "正常情况下 30 分钟内联系您",
  },
  en: {
    contactDescription:
      "For after-service issues, complaints, or suggestions, scan the QR code to add us on WeChat first.",
    contactTitle: "Scan to contact after-service support",
    qrDescription:
      "For after-service issues, complaints, or suggestions, scan the QR code to add us on WeChat first.",
    qrItems: [
      {
        id: "support",
        label: "After-service",
        src: "/after-sales/support-qr-1.jpg",
      },
      {
        id: "feedback",
        label: "Complaints",
        src: "/after-sales/support-qr-2.jpg",
      },
    ],
    qrTitle: "Scan to contact after-service support",
    responseMeta: "Normally we contact you within 30 minutes",
  },
}

const defaultCmsContent: CmsContent = {
  version: 1,
  updatedAt: "",
  afterSalesPage: defaultAfterSalesPage,
  blogCategories: defaultBlogCategories,
  blogPosts: defaultBlogPosts,
  contactPage: defaultContactPage,
  galleryItems: defaultGalleryItems,
  reviewItems: defaultReviewItems,
  faq: {
    zh: {
      ...faqContent.zh,
      items: faqContent.zh.items.map((item, index) => ({
        ...item,
        id: `zh-faq-${index + 1}`,
        status: "published",
        sortOrder: index + 1,
      })),
    },
    en: {
      ...faqContent.en,
      items: faqContent.en.items.map((item, index) => ({
        ...item,
        id: `en-faq-${index + 1}`,
        status: "published",
        sortOrder: index + 1,
      })),
    },
  },
  paymentOrders: [],
  paymentSettings: {
    enabled: false, // showcase: payments disabled
    provider: "airwallex",
    currency: "USD",
  },
  notificationSettings: {
    recipientEmail: companyIdentity.contactEmail,
    smtpFrom: "",
    smtpHost: "",
    smtpPassword: "",
    smtpPort: "587",
    smtpSecure: false,
    smtpUsername: "",
  },
  siteSettings: {
    logoImage: "/logo.webp",
  },
}

export {
  defaultAfterSalesPage,
  defaultBlogCategories,
  defaultBlogPosts,
  defaultCmsContent,
  defaultContactPage,
  defaultGalleryItems,
  defaultReviewItems,
}

export type { CmsAfterSalesPageContent, CmsContactPageContent }
