import type { Icon } from "@phosphor-icons/react"
import {
  Baby,
  Buildings,
  CalendarCheck,
  ChatCircleText,
  CheckCircle,
  Clock,
  Heart,
  HouseLine,
  PawPrint,
  PhoneCall,
  ShieldCheck,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react"

export type NavItem = {
  label: string
  href: string
}

export type StatItem = {
  value: string
  label: string
}

export type TextCardItem = {
  title: string
  text: string
}

export type IconCardItem = TextCardItem & {
  icon: Icon
}

export type ServiceItem = {
  title: string
  tag: string
  image: string
  text: string
  points: string[]
}

export type TestimonialItem = {
  name: string
  text: string
}

export type CountryItem = {
  name: string
  cities: string
}

export type ServiceLocation = {
  id: string
  city: string
  country: string
  label: string
  latitude: number
  longitude: number
}

export type ServiceRegion = {
  id: string
  name: string
  code2: string
  latitude: number
  longitude: number
  cities: string[]
  isTiny?: boolean
}

export const navItems: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "画廊", href: "/gallery" },
  { label: "常见问题", href: "/faq" },
  { label: "售后", href: "/after-sales" },
  { label: "加入我们", href: "/join" },
  { label: "关于我们", href: "/about" },
]

export const heroStats: StatItem[] = [
  { value: "97%", label: "好评率" },
  { value: "100+", label: "服务阿姨" },
  { value: "7 年", label: "经验沉淀" },
]

export const stats: StatItem[] = [
  { value: "7 年", label: "团队阿姨从业经验" },
  { value: "100000+", label: "累计服务华人家庭" },
  { value: "97%", label: "客户好评率" },
  { value: "100+", label: "长期合作阿姨" },
]

export const values: TextCardItem[] = [
  {
    title: "价格更安心",
    text: "服务前先沟通范围与需求，报价规则提前说明。不靠模糊低价吸引客户，也不让客户服务后才发现各种隐藏收费。",
  },
  {
    title: "服务更有心",
    text: "厨房、浴室、边角、死角等重点区域，都有清楚的服务流程。不是随便打扫一下，而是尽力把每一次服务都做得稳定、细致。",
  },
  {
    title: "安排更省心",
    text: "根据房型、服务类型和现场情况安排合适的阿姨与服务时间。如有变动，客服会提前沟通确认，不让客户临时被动等待。",
  },
  {
    title: "售后更放心",
    text: "服务完成后持续跟进客户反馈。如果有问题，不推脱、不消失，而是认真沟通，负责到底。",
  },
]

export const serviceFlow = [
  "面试",
  "试工",
  "老阿姨带新阿姨",
  "独立上门",
  "上门前确认",
  "现场巡视",
  "清洁服务",
  "验收签字",
  "客服回访",
  "售后处理",
]

export const choiceCards: IconCardItem[] = [
  {
    icon: UsersThree,
    title: "阿姨有筛选",
    text: "面试、试工、带教后再独立上门，不把服务质量交给运气。",
  },
  {
    icon: ShieldCheck,
    title: "价格先讲清",
    text: "服务类型、预计时间、附加项目提前说明，尽量避免临时加价。",
  },
  {
    icon: CheckCircle,
    title: "服务有验收",
    text: "完成后按照重点区域检查，客户确认放心后再结束服务。",
  },
  {
    icon: ChatCircleText,
    title: "售后有人管",
    text: "服务后客服回访，有问题有人对接，不让客户被晾着。",
  },
]

export const highlights: IconCardItem[] = [
  {
    icon: Clock,
    title: "最快当天 / 次日上门",
    text: "依托稳定的阿姨体系，尽量为您安排当天或次日服务，临时需要清洁也能更快响应。",
  },
  {
    icon: ShieldCheck,
    title: "严格筛选与培训",
    text: "阿姨上岗前需经过面试、试工和培训，清洁能力和服务态度不合格，不安排上门。",
  },
  {
    icon: PhoneCall,
    title: "超长时间客服在线",
    text: "从预约、上门到服务结束，全程都有专人跟进，遇到问题可以及时沟通处理。",
  },
  {
    icon: Baby,
    title: "宝宝和宠物友好",
    text: "我们优先使用对宝宝和宠物更友好的清洁用品，也可根据客户需求灵活调整。",
  },
  {
    icon: Heart,
    title: "服务态度有要求",
    text: "我们不接受甩脸色、态度差、沟通不耐烦的服务人员。进客户家，态度和质量一样重要。",
  },
  {
    icon: Sparkle,
    title: "更灵活的定制服务",
    text: "服务范围外的小需求，只要现场阿姨力所能及、顺手可做，我们都会尽量帮您处理。",
  },
]

export const services: ServiceItem[] = [
  {
    title: "日常清洁",
    tag: "Regular Cleaning",
    image: "/services/regular.jpg",
    text: "适合长期居住家庭、宝宝和忙碌上班族。可选择 Weekly、Bi-weekly 或 Monthly。",
    points: ["客厅卧室整理", "厨卫基础清洁", "地面吸尘拖洗", "固定周期维护"],
  },
  {
    title: "深度清洁",
    tag: "Deep Cleaning",
    image: "/services/deep.jpg",
    text: "加强厨房油污、浴室水垢、边角死角和长期积灰区域，适合阶段性重点处理。",
    points: ["厨房重油污处理", "浴室水垢清洁", "边角死角加强", "柜体外部擦拭"],
  },
  {
    title: "开荒清洁",
    tag: "Post-renovation",
    image: "/services/post-renovation.jpg",
    text: "适合新房、装修后或首次入住前，重点处理粉尘与表面污渍。",
    points: [
      "装修浮尘清理",
      "玻璃与表面擦拭",
      "大面积地面处理",
      "入住前重点复核",
    ],
  },
  {
    title: "退租清洁",
    tag: "Move-out Cleaning",
    image: "/services/move-out.jpg",
    text: "适合搬家交房、留学生、公寓退租和房东验收准备。",
    points: [
      "空房整体清洁",
      "厨卫重点处理",
      "门窗与柜体外部",
      "交接前验收配合",
    ],
  },
  {
    title: "商业清洁",
    tag: "Commercial Cleaning",
    image: "/services/commercial.jpg",
    text: "办公室、店铺、工作室等小型商业空间，可按场地定制范围。",
    points: ["办公区清洁", "店铺日常维护", "公共区域整理", "按场地定制范围"],
  },
  {
    title: "定期清洁",
    tag: "Recurring Cleaning",
    image: "/services/recurring.jpg",
    text: "固定周期、稳定阿姨、长期维护，让家里持续保持干净。",
    points: ["固定周期安排", "尽量稳定人员", "长期维护计划", "客服持续跟进"],
  },
]

export const serviceAnchorIds = [
  "service-regular-cleaning",
  "service-deep-cleaning",
  "service-post-renovation",
  "service-move-out",
  "service-commercial",
  "service-recurring",
] as const

export const bookingSteps: TextCardItem[] = [
  {
    title: "告诉我们您的需求",
    text: "通过预约表单提交服务类型、房屋面积、房间数量、服务地址以及重点清洁位置。",
  },
  {
    title: "客服确认并生成预约单",
    text: "我们根据房屋情况确认服务类型、预计时间、参考价格和可预约档期，确认后生成预约单。",
  },
  {
    title: "等待阿姨上门服务",
    text: "预约完成后，按约定时间等待上门。服务前建立沟通群，同步客户、阿姨和售后负责人。",
  },
  {
    title: "上门前提前沟通",
    text: "阿姨提前确认时间、地址和注意事项；特殊用品、宠物提醒、重点区域都可提前说明。",
  },
  {
    title: "服务中灵活沟通",
    text: "现场临时需求会尽量协助；如涉及额外时间或项目，会提前确认，不随意加价。",
  },
  {
    title: "售后负责人全程跟进",
    text: "服务完成后跟进质量与客户反馈，有任何问题可在群内沟通，我们会及时处理。",
  },
]

export const testimonials: TestimonialItem[] = [
  {
    name: "洛杉矶留学生客户",
    text: "临时要退租，客服很快帮我安排了阿姨。价格提前说清楚，清洁完也有验收，比我之前找的省心很多。",
  },
  {
    name: "尔湾家庭客户",
    text: "家里有宝宝和猫，阿姨上门前会先确认用品和注意事项。做事很安静，厨房和浴室细节处理得很好。",
  },
  {
    name: "西雅图上班族",
    text: "工作太忙，最怕沟通成本高。他们会建群同步时间、地址和重点区域，服务后客服还会回访。",
  },
  {
    name: "纽约公寓客户",
    text: "我最在意隐藏收费，这次预约前就把范围和可能加项讲清楚了，整体体验很稳定。",
  },
]

export const countries: CountryItem[] = [
  {
    name: "美国",
    cities:
      "洛杉矶 / 尔湾、西雅图、圣何塞、旧金山、费城、芝加哥、纽约、波士顿、底特律",
  },
  { name: "英国", cities: "伦敦、伯明翰" },
  { name: "法国", cities: "巴黎 / 巴黎大区" },
  { name: "新加坡", cities: "新加坡" },
  { name: "加拿大", cities: "多伦多 GTA、温哥华" },
  { name: "澳大利亚", cities: "悉尼、墨尔本、布里斯班" },
  { name: "新西兰", cities: "奥克兰" },
  { name: "马来西亚", cities: "吉隆坡 / 巴生谷、槟城 / 乔治市、新山" },
  { name: "日本", cities: "东京、大阪" },
  { name: "韩国", cities: "首尔" },
]

export const serviceRegions: ServiceRegion[] = [
  {
    id: "USA",
    name: "美国",
    code2: "US",
    latitude: 38,
    longitude: -97,
    cities: [
      "洛杉矶 / 尔湾",
      "西雅图",
      "圣何塞",
      "旧金山",
      "费城",
      "芝加哥",
      "纽约",
      "波士顿",
      "底特律",
    ],
  },
  {
    id: "GBR",
    name: "英国",
    code2: "GB",
    latitude: 53.5,
    longitude: -2.5,
    cities: ["伦敦", "伯明翰"],
  },
  {
    id: "FRA",
    name: "法国",
    code2: "FR",
    latitude: 46.2,
    longitude: 2.2,
    cities: ["巴黎 / 巴黎大区"],
  },
  {
    id: "SGP",
    name: "新加坡",
    code2: "SG",
    latitude: 1.35,
    longitude: 103.81,
    cities: ["新加坡"],
    isTiny: true,
  },
  {
    id: "CAN",
    name: "加拿大",
    code2: "CA",
    latitude: 56.1,
    longitude: -106.3,
    cities: ["多伦多 GTA", "温哥华"],
  },
  {
    id: "AUS",
    name: "澳大利亚",
    code2: "AU",
    latitude: -25.2,
    longitude: 133.7,
    cities: ["悉尼", "墨尔本", "布里斯班"],
  },
  {
    id: "NZL",
    name: "新西兰",
    code2: "NZ",
    latitude: -40.9,
    longitude: 174.8,
    cities: ["奥克兰"],
  },
  {
    id: "MYS",
    name: "马来西亚",
    code2: "MY",
    latitude: 4.2,
    longitude: 101.9,
    cities: ["吉隆坡 / 巴生谷", "槟城 / 乔治市", "新山"],
  },
  {
    id: "JPN",
    name: "日本",
    code2: "JP",
    latitude: 36.2,
    longitude: 138.2,
    cities: ["东京", "大阪"],
  },
  {
    id: "KOR",
    name: "韩国",
    code2: "KR",
    latitude: 35.9,
    longitude: 127.7,
    cities: ["首尔"],
  },
]

export const serviceLocations: ServiceLocation[] = [
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

export const footerServices: IconCardItem[] = [
  { icon: HouseLine, title: "家庭清洁", text: "" },
  { icon: Buildings, title: "公寓 / 退租", text: "" },
  { icon: PawPrint, title: "宠物友好", text: "" },
  { icon: CalendarCheck, title: "预约制服务", text: "" },
]
