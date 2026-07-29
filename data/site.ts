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

// 服务区域类型已迁移至 @/types/cms（CmsServiceRegion / CmsServiceLocation），
// 此处仅做 re-export 以保持现有 import 路径 `@/data/site` 兼容。
export type { CmsServiceLocation as ServiceLocation } from "@/types/cms"
export type { CmsServiceRegion as ServiceRegion } from "@/types/cms"

export const navItems: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "画廊", href: "/gallery" },
  { label: "常见问题", href: "/faq" },
  { label: "售后", href: "/after-sales" },
  { label: "加入我们", href: "/about#join" },
  { label: "关于我们", href: "/about" },
]

export const heroStats: StatItem[] = [
  { value: "97%", label: "好评率" },
  { value: "100+", label: "合作阿姨" },
  { value: "7 年", label: "经验沉淀" },
]

export const stats: StatItem[] = [
  { value: "7 年", label: "团队阿姨从业经验" },
  { value: "10000+", label: "累计服务华人家庭" },
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

export const footerServices: IconCardItem[] = [
  { icon: HouseLine, title: "家庭清洁", text: "" },
  { icon: Buildings, title: "公寓 / 退租", text: "" },
  { icon: PawPrint, title: "宠物友好", text: "" },
  { icon: CalendarCheck, title: "预约制服务", text: "" },
]
