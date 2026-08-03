import { faqContent } from "@/data/faq"
import type {
  CmsAfterSalesPageContent,
  CmsBlogCategory,
  CmsBlogPost,
  CmsBookingCatalogItem,
  CmsBookingLocationConfig,
  CmsContactPageContent,
  CmsContent,
  CmsGalleryItem,
  CmsServiceLocation,
  CmsServiceRegion,
} from "@/types/cms"

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
  (_, index) => ({
    id: `review-${String(index + 1).padStart(2, "0")}`,
    src: `/review-screenshots/display/review-${String(index + 1).padStart(
      2,
      "0"
    )}.jpg`,
    status: "published",
    sortOrder: index + 1,
  })
)

// 服务区域：国家/地区。id 为 ISO_A3，与 public/data/countries.geojson
// 的 ISO_A3/ADM0_A3 字段匹配，决定 3D 地球轮廓高亮。
const defaultServiceRegions: CmsServiceRegion[] = [
  {
    id: "USA",
    name: "美国",
    code2: "US",
    latitude: 38,
    longitude: -97,
    cities: [],
  },
  {
    id: "GBR",
    name: "英国",
    code2: "GB",
    latitude: 53.5,
    longitude: -2.5,
    cities: [],
  },
  {
    id: "FRA",
    name: "法国",
    code2: "FR",
    latitude: 46.2,
    longitude: 2.2,
    cities: [],
  },
  {
    id: "SGP",
    name: "新加坡",
    code2: "SG",
    latitude: 1.35,
    longitude: 103.81,
    cities: [],
    isTiny: true,
  },
  {
    id: "CAN",
    name: "加拿大",
    code2: "CA",
    latitude: 56.1,
    longitude: -106.3,
    cities: [],
  },
  {
    id: "AUS",
    name: "澳大利亚",
    code2: "AU",
    latitude: -25.2,
    longitude: 133.7,
    cities: [],
  },
  {
    id: "NZL",
    name: "新西兰",
    code2: "NZ",
    latitude: -40.9,
    longitude: 174.8,
    cities: [],
  },
  {
    id: "MYS",
    name: "马来西亚",
    code2: "MY",
    latitude: 4.2,
    longitude: 101.9,
    cities: [],
  },
  {
    id: "JPN",
    name: "日本",
    code2: "JP",
    latitude: 36.2,
    longitude: 138.2,
    cities: [],
  },
  {
    id: "KOR",
    name: "韩国",
    code2: "KR",
    latitude: 35.9,
    longitude: 127.7,
    cities: [],
  },
]

// 服务区域：城市服务点。每个点对应 3D 地球上的一个标记。
// option 字符串格式 `${city} · ${country}` 被订单/预约/阿姨引用。
const defaultServiceLocations: CmsServiceLocation[] = [
  {
    id: "los-angeles",
    city: "洛杉矶",
    country: "美国",
    label: "Los Angeles",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  {
    id: "irvine",
    city: "尔湾",
    country: "美国",
    label: "Irvine",
    latitude: 33.6846,
    longitude: -117.8265,
  },
  {
    id: "seattle",
    city: "西雅图",
    country: "美国",
    label: "Seattle",
    latitude: 47.6061,
    longitude: -122.3328,
  },
  {
    id: "san-jose",
    city: "圣何塞",
    country: "美国",
    label: "San Jose",
    latitude: 37.3382,
    longitude: -121.8863,
  },
  {
    id: "san-francisco",
    city: "旧金山",
    country: "美国",
    label: "San Francisco",
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: "new-york",
    city: "纽约",
    country: "美国",
    label: "New York",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    id: "boston",
    city: "波士顿",
    country: "美国",
    label: "Boston",
    latitude: 42.3601,
    longitude: -71.0589,
  },
  {
    id: "chicago",
    city: "芝加哥",
    country: "美国",
    label: "Chicago",
    latitude: 41.8781,
    longitude: -87.6298,
  },
  {
    id: "philadelphia",
    city: "费城",
    country: "美国",
    label: "Philadelphia",
    latitude: 39.9526,
    longitude: -75.1652,
  },
  {
    id: "detroit",
    city: "底特律",
    country: "美国",
    label: "Detroit",
    latitude: 42.3314,
    longitude: -83.0458,
  },
  {
    id: "london",
    city: "伦敦",
    country: "英国",
    label: "London",
    latitude: 51.5072,
    longitude: -0.1276,
  },
  {
    id: "birmingham",
    city: "伯明翰",
    country: "英国",
    label: "Birmingham",
    latitude: 52.4862,
    longitude: -1.8904,
  },
  {
    id: "paris",
    city: "巴黎",
    country: "法国",
    label: "Paris",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    id: "singapore",
    city: "新加坡",
    country: "新加坡",
    label: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
  },
  {
    id: "toronto",
    city: "多伦多",
    country: "加拿大",
    label: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
  },
  {
    id: "vancouver",
    city: "温哥华",
    country: "加拿大",
    label: "Vancouver",
    latitude: 49.2827,
    longitude: -123.1207,
  },
  {
    id: "sydney",
    city: "悉尼",
    country: "澳大利亚",
    label: "Sydney",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  {
    id: "melbourne",
    city: "墨尔本",
    country: "澳大利亚",
    label: "Melbourne",
    latitude: -37.8136,
    longitude: 144.9631,
  },
  {
    id: "brisbane",
    city: "布里斯班",
    country: "澳大利亚",
    label: "Brisbane",
    latitude: -27.4698,
    longitude: 153.0251,
  },
  {
    id: "auckland",
    city: "奥克兰",
    country: "新西兰",
    label: "Auckland",
    latitude: -36.8509,
    longitude: 174.7645,
  },
  {
    id: "kuala-lumpur",
    city: "吉隆坡",
    country: "马来西亚",
    label: "Kuala Lumpur",
    latitude: 3.139,
    longitude: 101.6869,
  },
  {
    id: "penang",
    city: "槟城",
    country: "马来西亚",
    label: "Penang",
    latitude: 5.4164,
    longitude: 100.3327,
  },
  {
    id: "johor-bahru",
    city: "新山",
    country: "马来西亚",
    label: "Johor Bahru",
    latitude: 1.4927,
    longitude: 103.7414,
  },
  {
    id: "tokyo",
    city: "东京",
    country: "日本",
    label: "Tokyo",
    latitude: 35.6764,
    longitude: 139.65,
  },
  {
    id: "osaka",
    city: "大阪",
    country: "日本",
    label: "Osaka",
    latitude: 34.6937,
    longitude: 135.5023,
  },
  {
    id: "seoul",
    city: "首尔",
    country: "韩国",
    label: "Seoul",
    latitude: 37.5665,
    longitude: 126.978,
  },
]

const defaultBookingCatalogItems: CmsBookingCatalogItem[] = [
  {
    basePrice: 98,
    bathroomPrices: [
      { amount: 25, quantity: 1 },
      { amount: 50, quantity: 2 },
      { amount: 75, quantity: 3 },
      { amount: 100, quantity: 4 },
    ],
    bedroomPrices: [
      { amount: 25, quantity: 1 },
      { amount: 50, quantity: 2 },
      { amount: 75, quantity: 3 },
      { amount: 100, quantity: 4 },
      { amount: 125, quantity: 5 },
    ],
    description: "适合日常维护，包含客厅、卧室、厨房和卫生间基础清洁。",
    enabled: true,
    id: "regular-cleaning",
    label: "日常清洁",
    studioPrice: 20,
    type: "service",
  },
  {
    basePrice: 180,
    bathroomPrices: [
      { amount: 50, quantity: 1 },
      { amount: 100, quantity: 2 },
      { amount: 150, quantity: 3 },
      { amount: 200, quantity: 4 },
    ],
    bedroomPrices: [
      { amount: 50, quantity: 1 },
      { amount: 100, quantity: 2 },
      { amount: 150, quantity: 3 },
      { amount: 200, quantity: 4 },
      { amount: 250, quantity: 5 },
    ],
    description: "适合较长时间未彻底清洁的住宅，重点处理厨房、浴室和卫生死角。",
    enabled: true,
    id: "deep-cleaning",
    label: "深度清洁",
    studioPrice: 40,
    type: "service",
  },
  ...[
    ["move-out-cleaning", "退租清洁"],
    ["post-renovation-cleaning", "开荒清洁"],
    ["carpet-cleaning", "地毯清洗"],
    ["commercial-cleaning", "商业清洁"],
    ["recurring-cleaning", "定期清洁"],
    ["other-cleaning", "其他"],
  ].map(([id, label]) => ({
    basePrice: 0,
    description: "具体服务范围和费用由客服根据实际需求确认。",
    enabled: true,
    id,
    label,
    quoteRequired: true,
    type: "service" as const,
  })),
  {
    basePrice: 35,
    description: "清洁冰箱内部，不包含严重结冰处理。",
    enabled: true,
    id: "inside-fridge",
    label: "冰箱内部清洁",
    type: "addon",
  },
  {
    basePrice: 35,
    description: "清洁烤箱内部及可拆卸托盘。",
    enabled: true,
    id: "inside-oven",
    label: "烤箱内部清洁",
    type: "addon",
  },
  {
    basePrice: 30,
    description: "清洁橱柜内部，物品需提前清空。",
    enabled: true,
    id: "inside-cabinets",
    label: "橱柜内部清洁",
    type: "addon",
  },
  {
    basePrice: 0,
    description: "填写其他不包含在基础服务内的需求，由客服确认。",
    enabled: true,
    id: "other-addon",
    label: "其他",
    quoteRequired: true,
    type: "addon",
  },
]

const defaultBookingConfigs: CmsBookingLocationConfig[] =
  defaultServiceLocations.map((location) => ({
    currency:
      location.country === "英国"
        ? "GBP"
        : location.country === "加拿大"
          ? "CAD"
          : location.country === "澳大利亚"
            ? "AUD"
            : location.country === "新西兰"
              ? "NZD"
              : location.country === "新加坡"
                ? "SGD"
                : location.country === "马来西亚"
                  ? "MYR"
                  : location.country === "日本"
                    ? "JPY"
                    : location.country === "韩国"
                      ? "KRW"
                      : location.country === "法国"
                        ? "EUR"
                        : "USD",
    items: defaultBookingCatalogItems.map((item) => ({
      ...item,
      bathroomPrices: item.bathroomPrices?.map((price) => ({ ...price })),
      bedroomPrices: item.bedroomPrices?.map((price) => ({ ...price })),
    })),
    locationId: location.id,
  }))

const defaultContactPage: CmsContent["contactPage"] = {
  zh: {
    company: "AUNTIE CHEN HOME SERVICES INC",
    contactEmail: "auntiechenhome@gmail.com",
    contactPhone: "+1 9492798310",
    contactTitle: "客服联系方式",
    heroDescription:
      "如有预约、付款、退款、售后或隐私相关问题，请通过以下方式联系我们。",
    heroTitle: "联系我们",
    kicker: "Contact Us",
    methods: [
      {
        id: "phone-wechat",
        label: "电话 / 微信",
        text: "+1 9492798310",
      },
      {
        id: "support-email",
        label: "客服邮箱",
        text: "auntiechenhome@gmail.com",
      },
      {
        id: "company",
        label: "公司名称",
        text: "AUNTIE CHEN HOME SERVICES INC",
      },
    ],
    qrDescription: "建议优先扫码添加企业微信，电话、邮件回复可能会延迟。",
    qrImage: "/wechat_qrcode.jpg",
    qrTitle: "优先扫码联系",
    serviceArea: "服务地区",
    serviceAreaText:
      "美国、加拿大、澳洲、英国等海外华人城市，具体以客服确认为准。",
  },
  en: {
    company: "AUNTIE CHEN HOME SERVICES INC",
    contactEmail: "auntiechenhome@gmail.com",
    contactPhone: "+1 9492798310",
    contactTitle: "Support Contacts",
    heroDescription:
      "For booking, payment, refund, after-service, or privacy questions, contact us through the channels below.",
    heroTitle: "Contact Us",
    kicker: "Contact Us",
    methods: [
      {
        id: "phone-wechat",
        label: "Phone / WeChat",
        text: "+1 9492798310",
      },
      {
        id: "support-email",
        label: "Support email",
        text: "auntiechenhome@gmail.com",
      },
      {
        id: "company",
        label: "Company",
        text: "AUNTIE CHEN HOME SERVICES INC",
      },
    ],
    qrDescription:
      "We recommend scanning the WeCom QR code first. Phone and email replies may be delayed.",
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

const defaultTeamMembers: CmsContent["teamMembers"] = [
  {
    id: "team-1",
    name: "王阿姨",
    avatar: "",
    role: "高级保洁师",
    status: "on-task",
    currentOrder: "AC-2506-0081",
    area: "Irvine · USA",
    completedCount: 142,
    rating: 4.9,
  },
  {
    id: "team-2",
    name: "李阿姨",
    avatar: "",
    role: "深度保洁师",
    status: "available",
    area: "Vancouver · Canada",
    completedCount: 98,
    rating: 4.8,
  },
  {
    id: "team-3",
    name: "张阿姨",
    avatar: "",
    role: "退租清洁专员",
    status: "on-task",
    currentOrder: "AC-2506-0079",
    area: "Sydney · Australia",
    completedCount: 76,
    rating: 4.7,
  },
  {
    id: "team-4",
    name: "刘阿姨",
    avatar: "",
    role: "日常保洁师",
    status: "off-duty",
    area: "London · UK",
    completedCount: 54,
    rating: 4.6,
  },
  {
    id: "team-5",
    name: "陈阿姨",
    avatar: "",
    role: "开荒清洁专员",
    status: "available",
    area: "Irvine · USA",
    completedCount: 31,
    rating: 4.5,
  },
  {
    id: "team-6",
    name: "赵阿姨",
    avatar: "",
    role: "高级保洁师",
    status: "on-leave",
    area: "Toronto · Canada",
    completedCount: 87,
    rating: 4.8,
  },
]

function createDefaultTasks(): CmsContent["dashboardTasks"] {
  const now = Date.now()
  const day = 86_400_000
  return [
    {
      id: "task-1",
      title: "联系退租客户确认到场时间",
      description:
        "订单 AC-2506-0079 的客户预约了明天退租清洁，需要电话确认到场时间",
      priority: "high",
      status: "pending",
      dueDate: new Date(now + 2 * 3_600_000).toISOString(),
      assignee: "客服组",
      relatedOrderId: "AC-2506-0079",
      createdAt: new Date(now - 6 * 3_600_000).toISOString(),
    },
    {
      id: "task-2",
      title: "安排王阿姨上门服务",
      description: "Irvine 区域日常清洁订单，已匹配王阿姨，需要确认排班",
      priority: "high",
      status: "in-progress",
      dueDate: new Date(now + day).toISOString(),
      assignee: "调度组",
      relatedOrderId: "AC-2506-0081",
      createdAt: new Date(now - 12 * 3_600_000).toISOString(),
    },
    {
      id: "task-3",
      title: "跟进悉尼退租清洁验收",
      description: "张阿姨已完成 Sydney 退租清洁，等待客户验收反馈",
      priority: "medium",
      status: "pending",
      dueDate: new Date(now + 2 * day).toISOString(),
      assignee: "售后组",
      relatedOrderId: "AC-2506-0079",
      createdAt: new Date(now - 18 * 3_600_000).toISOString(),
    },
    {
      id: "task-4",
      title: "补充 London 区域保洁排班",
      description: "刘阿姨今日休息，需协调其他阿姨覆盖 London 2 笔日常清洁",
      priority: "medium",
      status: "pending",
      dueDate: new Date(now + 3 * day).toISOString(),
      assignee: "调度组",
      createdAt: new Date(now - day).toISOString(),
    },
    {
      id: "task-5",
      title: "整理本月客户好评截图",
      description: "从微信和邮件渠道收集本月客户好评，更新到首页好评区域",
      priority: "low",
      status: "completed",
      dueDate: new Date(now - day).toISOString(),
      assignee: "运营组",
      createdAt: new Date(now - 5 * day).toISOString(),
    },
    {
      id: "task-6",
      title: "更新 Airwallex 支付配置",
      description: "切换到生产环境前需要补充 webhook 回调地址和密钥",
      priority: "medium",
      status: "pending",
      dueDate: new Date(now + 7 * day).toISOString(),
      assignee: "技术组",
      createdAt: new Date(now - 3 * day).toISOString(),
    },
  ]
}

const defaultCmsContent: CmsContent = {
  version: 1,
  updatedAt: "",
  afterSalesPage: defaultAfterSalesPage,
  blogCategories: defaultBlogCategories,
  blogPosts: defaultBlogPosts,
  bookingConfigs: defaultBookingConfigs,
  contactPage: defaultContactPage,
  dashboardTasks: createDefaultTasks(),
  galleryItems: defaultGalleryItems,
  reviewItems: defaultReviewItems,
  salesMembers: [],
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
  formulaTemplates: [
    {
      createdAt: "",
      enabled: true,
      id: "formula-order-profit",
      name: "默认公司利润",
      target: "orderProfit",
      tokens: [
        { type: "field", value: "receivedAmount" },
        { type: "operator", value: "-" },
        { type: "field", value: "auntieSalary" },
        { type: "operator", value: "-" },
        { type: "field", value: "otherCost" },
        { type: "operator", value: "-" },
        { type: "field", value: "salesCommission" },
      ],
      updatedAt: "",
      version: 1,
    },
  ],
  paymentOrders: [],
  paymentSettings: {
    enabled: false,
    provider: "airwallex",
    currency: "USD",
  },
  notificationSettings: {
    recipientEmail: "auntiechenhome@gmail.com",
    smtpFrom: "",
    smtpHost: "",
    smtpPassword: "",
    smtpPort: "587",
    smtpSecure: false,
    smtpUsername: "",
  },
  serviceRegions: defaultServiceRegions,
  serviceLocations: defaultServiceLocations,
  siteSettings: {
    logoImage: "/logo.webp",
  },
  teamMembers: defaultTeamMembers,
}

export {
  defaultAfterSalesPage,
  defaultBlogCategories,
  defaultBlogPosts,
  defaultBookingConfigs,
  defaultCmsContent,
  defaultContactPage,
  defaultGalleryItems,
  defaultReviewItems,
  defaultServiceLocations,
  defaultServiceRegions,
}

export type { CmsAfterSalesPageContent, CmsContactPageContent }
