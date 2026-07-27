import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  Armchair,
  Bathtub,
  Broom,
  CookingPot,
  Garage,
  Package,
  PaperPlaneTilt,
  Rug,
  SquaresFour,
  Sparkle,
  type Icon,
} from "@phosphor-icons/react"
import { Link } from "@/lib/router-compat"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { serviceRegions } from "@/data/site"
import { useI18n, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type BookingFormState = {
  bathrooms: string
  bedrooms: string
  contact: string
  fullName: string
  notes: string
  preferredDate: string
  serviceAddress: string
  serviceArea: string
  serviceType: string
}

type BookingCopy = {
  addOnTitle: string
  bathrooms: string
  bedrooms: string
  contact: string
  details: string
  estimateCustom: string
  estimateEmpty: string
  estimateNote: string
  estimateTitle: string
  formDescription: string
  formTitle: string
  fullName: string
  heroDescription: string
  heroTitle: string
  kicker: string
  legalNotice: string
  otherCity: string
  preferredDate: string
  priceDialogAction: string
  priceDialogCityLabel: string
  priceDialogDescription: string
  priceDialogNote: string
  priceDialogTitle: string
  privacy: string
  serviceArea: string
  serviceAddress: string
  serviceType: string
  serviceTypes: string[]
  submit: string
  submitError: string
  submitted: string
  submitting: string
  success: string
  terms: string
  phoneTitle: string
  phoneText: string
  quoteRequired: string
  quoteRequiredAction: string
  quoteRequiredTitle: string
}

type PricingTier = {
  label: string
  maxBathrooms: number
  maxBedrooms: number
  price: string
  time: Record<Language, string>
}

type PriceEstimate = {
  label: string
  price: string
  time: string
}

type AddOnService = {
  icon: Icon
  label: Record<Language, string>
  price: string
}

type LocalizedText = Record<Language, string>

type PricingCityId = "bayArea" | "boston" | "losAngeles" | "seattle"

type PricingSection = {
  columns: LocalizedText[]
  note?: LocalizedText
  rows: LocalizedText[][]
  title: LocalizedText
}

type CityPricingTable = {
  description: LocalizedText
  id: PricingCityId
  name: LocalizedText
  sections: PricingSection[]
}

function text(zh: string, en: string): LocalizedText {
  return { en, zh }
}

const bookingCopy: Record<Language, BookingCopy> = {
  zh: {
    addOnTitle: "附加服务",
    bathrooms: "卫生间数量",
    bedrooms: "卧室数量",
    contact: "联系方式（电话 / 邮箱 / 微信）",
    details: "备注",
    estimateCustom: "该户型或服务类型需要客服确认价格",
    estimateEmpty: "选择服务类型并输入卧室、卫生间数量后显示参考价。",
    estimateNote:
      "价格表仅作预估参考，最终价格会根据城市、房屋状态、附加项目和现场情况由客服确认。",
    estimateTitle: "参考时间与预估价格",
    formDescription:
      "填写服务信息后，可先查看参考价。提交后请通过邮箱联系客服确认方案与档期。",
    formTitle: "提交预约需求",
    fullName: "联系人姓名 / 称呼",
    heroDescription:
      "请填写服务区域、卧室数量、卫生间数量和清洁需求。我们会根据您的信息确认合适的服务方案和大概价格。",
    heroTitle: "预约清洁服务",
    kicker: "Booking",
    legalNotice: "提交即表示你同意",
    otherCity: "咨询其他城市",
    preferredDate: "期望预约日期",
    priceDialogAction: "查看完整价格表",
    priceDialogCityLabel: "价格城市",
    priceDialogDescription:
      "不同城市的服务时长、人员安排和附加项目标准不同，请以客服最终确认为准。",
    priceDialogNote:
      "以下价格为参考价。现场情况、房屋状态、特殊材质、附加项目或客户描述差异较大时，最终报价可能调整。",
    priceDialogTitle: "服务价格表",
    privacy: "隐私政策",
    serviceArea: "服务城市 / 区域",
    serviceType: "清洁需求",
    serviceTypes: [
      "日常清洁",
      "深度清洁",
      "退租清洁",
      "开荒清洁",
      "地毯清洗",
      "商业清洁",
      "定期清洁",
      "其他",
    ],
    serviceAddress: "详细地址",
    submit: "提交预约需求",
    submitError: "提交失败，请稍后再试，或直接通过邮箱联系我们。",
    submitted: "预约需求已提交",
    submitting: "发送中...",
    success:
      "预约需求已提交。请通过邮箱联系客服，进一步确认服务方案、价格和可预约时间。",
    terms: "服务条款",
    phoneTitle: "需要更快沟通？",
    phoneText: "可先电话或企业微信联系，表单信息后续可同步给客服。",
    quoteRequired:
      "该户型或服务类型需要客服确认报价。请联系客服确认最终价格与可预约时间。",
    quoteRequiredAction: "联系客服获取报价",
    quoteRequiredTitle: "需要客服确认报价",
  },
  en: {
    addOnTitle: "Add-on services",
    bathrooms: "Bathrooms",
    bedrooms: "Bedrooms",
    contact: "Contact method (phone / email / WeChat)",
    details: "Notes",
    estimateCustom: "This home type or service needs support confirmation",
    estimateEmpty:
      "Select a service type and enter bedrooms and bathrooms to see a reference price.",
    estimateNote:
      "The table is for reference only. Final pricing depends on city, home condition, add-ons, and on-site details confirmed by support.",
    estimateTitle: "Reference time and estimated price",
    formDescription:
      "After entering the service details, you can review the reference price. Please contact support by email to confirm the plan and schedule.",
    formTitle: "Submit a booking request",
    fullName: "Contact name / nickname",
    heroDescription:
      "Share your service area, bedroom count, bathroom count, and cleaning needs. We will confirm a suitable service plan and estimated price.",
    heroTitle: "Book Cleaning Service",
    kicker: "Booking",
    legalNotice: "By submitting, you agree to the",
    otherCity: "Ask about another city",
    preferredDate: "Preferred service date",
    priceDialogAction: "View full pricing",
    priceDialogCityLabel: "Pricing city",
    priceDialogDescription:
      "Service duration, staffing, and add-on standards vary by city. Final pricing is confirmed by support.",
    priceDialogNote:
      "Prices below are for reference. Final quotes may change based on home condition, special materials, add-ons, or major differences from the submitted details.",
    priceDialogTitle: "Service Pricing",
    privacy: "Privacy Policy",
    serviceArea: "Service city / area",
    serviceType: "Cleaning need",
    serviceTypes: [
      "Regular Cleaning",
      "Deep Cleaning",
      "Move-out Cleaning",
      "Post-renovation Cleaning",
      "Carpet Cleaning",
      "Commercial Cleaning",
      "Recurring Cleaning",
      "Other",
    ],
    serviceAddress: "Detailed address",
    submit: "Submit booking request",
    submitError:
      "Submission failed. Please try again later or contact us by phone / WeChat.",
    submitted: "Booking request received",
    submitting: "Sending...",
    success:
      "Your booking request has been submitted. Please contact support by email to confirm the service plan, price, and schedule.",
    terms: "Terms of Service",
    phoneTitle: "Need faster help?",
    phoneText:
      "You can contact us by phone or WeCom first, then share the form details with support.",
    quoteRequired:
      "This home type or service needs support confirmation. Please contact support for the final quote and available schedule.",
    quoteRequiredAction: "Contact support for quote",
    quoteRequiredTitle: "Quote confirmation required",
  },
}

const mobileBookingCopy = {
  zh: {
    addressDialogDescription: "保存后会自动带入下次预约。",
    addressDialogTitle: "服务地址与联系人",
    addressEmpty: "填写服务地址与联系人",
    addressSummaryTitle: "服务地址与联系人",
    priceAuto: "根据规格自动计算",
    saveAddress: "保存信息",
    contact: "联系方式",
    home: "房屋信息",
    location: "服务地址",
    notes: "补充说明",
    schedule: "预约时间",
    service: "选择服务",
  },
  en: {
    addressDialogDescription: "Saved details will be used next time.",
    addressDialogTitle: "Address and contact",
    addressEmpty: "Add address and contact",
    addressSummaryTitle: "Service address and contact",
    priceAuto: "Calculated from home details",
    saveAddress: "Save details",
    contact: "Contact",
    home: "Home details",
    location: "Service address",
    notes: "Notes",
    schedule: "Schedule",
    service: "Choose service",
  },
} as const satisfies Record<Language, Record<string, string>>

const bookingContactStorageKey = "auntie-chen-booking-contact"

const pricingTable: Record<"deep" | "moveOut" | "regular", PricingTier[]> = {
  regular: [
    {
      label: "1B1B - 2B1.5B",
      maxBathrooms: 1.5,
      maxBedrooms: 2,
      price: "$148",
      time: { zh: "2小时", en: "2 hours" },
    },
    {
      label: "2B2B - 4B2.5B",
      maxBathrooms: 2.5,
      maxBedrooms: 4,
      price: "$228",
      time: { zh: "3小时", en: "3 hours" },
    },
    {
      label: "3B3B - 4B4.5B",
      maxBathrooms: 4.5,
      maxBedrooms: 4,
      price: "$278",
      time: { zh: "4小时", en: "4 hours" },
    },
    {
      label: "5B3B - 5B5.5B",
      maxBathrooms: 5.5,
      maxBedrooms: 5,
      price: "$348",
      time: { zh: "5小时", en: "5 hours" },
    },
  ],
  deep: [
    {
      label: "1B1B - 2B1.5B",
      maxBathrooms: 1.5,
      maxBedrooms: 2,
      price: "$280",
      time: { zh: "3小时", en: "3 hours" },
    },
    {
      label: "2B2B - 4B2.5B",
      maxBathrooms: 2.5,
      maxBedrooms: 4,
      price: "$438",
      time: { zh: "4小时", en: "4 hours" },
    },
    {
      label: "3B3B - 4B4.5B",
      maxBathrooms: 4.5,
      maxBedrooms: 4,
      price: "$548",
      time: { zh: "5小时", en: "5 hours" },
    },
    {
      label: "5B3B - 5B5.5B",
      maxBathrooms: 5.5,
      maxBedrooms: 5,
      price: "$718",
      time: { zh: "6小时", en: "6 hours" },
    },
  ],
  moveOut: [
    {
      label: "1B1B - 2B1.5B",
      maxBathrooms: 1.5,
      maxBedrooms: 2,
      price: "$358",
      time: { zh: "3小时内", en: "within 3 hours" },
    },
    {
      label: "2B2B - 4B2.5B",
      maxBathrooms: 2.5,
      maxBedrooms: 4,
      price: "$458",
      time: { zh: "4小时内", en: "within 4 hours" },
    },
    {
      label: "3B3B - 4B4.5B",
      maxBathrooms: 4.5,
      maxBedrooms: 4,
      price: "$589",
      time: { zh: "5小时内", en: "within 5 hours" },
    },
    {
      label: "5B3B - 5B5.5B",
      maxBathrooms: 5.5,
      maxBedrooms: 5,
      price: "$678",
      time: { zh: "6小时内", en: "within 6 hours" },
    },
  ],
}

const addOnServices: AddOnService[] = [
  {
    icon: SquaresFour,
    label: { zh: "玻璃窗", en: "Windows" },
    price: "$15/个",
  },
  {
    icon: Rug,
    label: { zh: "高温地毯清洗", en: "Steam carpet cleaning" },
    price: "$45-60/房",
  },
  {
    icon: CookingPot,
    label: { zh: "冰箱", en: "Fridge" },
    price: "$30-50",
  },
  {
    icon: Garage,
    label: { zh: "车库", en: "Garage" },
    price: "$30-50",
  },
  {
    icon: Sparkle,
    label: { zh: "地毯精油养护", en: "Carpet essential oil care" },
    price: "$40/房",
  },
  {
    icon: Armchair,
    label: { zh: "3人位沙发养护", en: "3-seat sofa care" },
    price: "$50",
  },
  {
    icon: Bathtub,
    label: { zh: "浴室消毒", en: "Bathroom disinfection" },
    price: "$40",
  },
  {
    icon: Package,
    label: { zh: "专业收纳", en: "Professional organizing" },
    price: "$65/h",
  },
]

const cityPricingTables: CityPricingTable[] = [
  {
    id: "losAngeles",
    name: text("洛杉矶 / 橙县", "Los Angeles / Orange County"),
    description: text(
      "覆盖洛杉矶及橙县主要华人社区，具体地址是否可安排以客服确认为准。",
      "Covers major Chinese communities in Los Angeles and Orange County, subject to support confirmation."
    ),
    sections: [
      {
        title: text("日常保洁", "Regular cleaning"),
        columns: [
          text("参考时间", "Reference time"),
          text("户型范围", "Home type"),
          text("预估价格", "Estimated price"),
          text("标签", "Tag"),
        ],
        rows: [
          [
            text("2 小时", "2 hours"),
            text("1B1B ~ 2B1.5B", "1B1B - 2B1.5B"),
            text("$148", "$148"),
            text("好评最多", "Most reviewed"),
          ],
          [
            text("3 小时", "3 hours"),
            text("2B2B ~ 4B2.5B", "2B2B - 4B2.5B"),
            text("$228", "$228"),
            text("-", "-"),
          ],
          [
            text("4 小时", "4 hours"),
            text("3B3B ~ 4B4.5B", "3B3B - 4B4.5B"),
            text("$278", "$278"),
            text("-", "-"),
          ],
          [
            text("5 小时", "5 hours"),
            text("5B3B ~ 5B5.5B", "5B3B - 5B5.5B"),
            text("$348", "$348"),
            text("-", "-"),
          ],
        ],
      },
      {
        title: text("深度保洁", "Deep cleaning"),
        columns: [
          text("参考时间", "Reference time"),
          text("户型范围", "Home type"),
          text("预估价格", "Estimated price"),
          text("标签", "Tag"),
        ],
        rows: [
          [
            text("3 小时", "3 hours"),
            text("1B1B ~ 2B1.5B", "1B1B - 2B1.5B"),
            text("$280", "$280"),
            text("-", "-"),
          ],
          [
            text("4 小时", "4 hours"),
            text("2B2B ~ 4B2.5B", "2B2B - 4B2.5B"),
            text("$438", "$438"),
            text("下单最多", "Most booked"),
          ],
          [
            text("5 小时", "5 hours"),
            text("3B3B ~ 4B4.5B", "3B3B - 4B4.5B"),
            text("$548", "$548"),
            text("-", "-"),
          ],
          [
            text("6 小时", "6 hours"),
            text("5B3B ~ 5B5.5B", "5B3B - 5B5.5B"),
            text("$718", "$718"),
            text("-", "-"),
          ],
        ],
      },
      {
        title: text("开荒和退租", "Post-renovation and move-out"),
        columns: [
          text("参考时间", "Reference time"),
          text("户型范围", "Home type"),
          text("预估价格", "Estimated price"),
        ],
        rows: [
          [
            text("3 小时内", "Within 3 hours"),
            text("1B1B ~ 2B1.5B", "1B1B - 2B1.5B"),
            text("$358", "$358"),
          ],
          [
            text("4 小时内", "Within 4 hours"),
            text("2B2B ~ 4B2.5B", "2B2B - 4B2.5B"),
            text("$458", "$458"),
          ],
          [
            text("5 小时内", "Within 5 hours"),
            text("3B3B ~ 4B4.5B", "3B3B - 4B4.5B"),
            text("$589", "$589"),
          ],
          [
            text("6 小时内", "Within 6 hours"),
            text("5B3B ~ 5B5.5B", "5B3B - 5B5.5B"),
            text("$678", "$678"),
          ],
        ],
      },
      {
        title: text("附加项目", "Add-ons"),
        columns: [
          text("类型", "Type"),
          text("项目", "Item"),
          text("价格", "Price"),
          text("标签 / 备注", "Tag / note"),
        ],
        rows: [
          [
            text("附加费用", "Add-on fee"),
            text("玻璃窗", "Windows"),
            text("$15/个", "$15 each"),
            text("热门加购", "Popular"),
          ],
          [
            text("附加费用", "Add-on fee"),
            text("高温地毯清洗", "Steam carpet cleaning"),
            text("$45-60/房", "$45-60 / room"),
            text("-", "-"),
          ],
          [
            text("附加费用", "Add-on fee"),
            text("冰箱", "Fridge"),
            text("$30-50", "$30-50"),
            text("-", "-"),
          ],
          [
            text("附加费用", "Add-on fee"),
            text("车库", "Garage"),
            text("$30-50", "$30-50"),
            text("-", "-"),
          ],
          [
            text("高端保洁", "Premium care"),
            text("地毯精油养护", "Carpet essential oil care"),
            text("$40/房", "$40 / room"),
            text("-", "-"),
          ],
          [
            text("高端保洁", "Premium care"),
            text("3 人位沙发养护", "3-seat sofa care"),
            text("$50", "$50"),
            text("-", "-"),
          ],
          [
            text("高端保洁", "Premium care"),
            text("浴室消毒", "Bathroom disinfection"),
            text("$40", "$40"),
            text("人气项目", "Popular"),
          ],
          [
            text("高端保洁", "Premium care"),
            text("专业收纳", "Professional organizing"),
            text("$65/h", "$65/h"),
            text("-", "-"),
          ],
        ],
      },
      {
        title: text(
          "洛杉矶日常清洁次卡",
          "Los Angeles regular cleaning passes"
        ),
        columns: [
          text("面积 / 时长", "Area / time"),
          text("单次原价", "Single price"),
          text("3 次卡", "3-use pass"),
          text("3 次卡节省", "3-use saving"),
          text("6 次卡", "6-use pass"),
          text("6 次卡节省", "6-use saving"),
          text("标签", "Tag"),
        ],
        rows: [
          [
            text("1000 尺以内 / 2 小时", "Within 1000 sq ft / 2 hours"),
            text("$150", "$150"),
            text("$418", "$418"),
            text("$32", "$32"),
            text("$808", "$808"),
            text("$92", "$92"),
            text("-", "-"),
          ],
          [
            text("1000 - 2000 尺 / 3 小时", "1000 - 2000 sq ft / 3 hours"),
            text("$230", "$230"),
            text("$638", "$638"),
            text("$52", "$52"),
            text("$1236", "$1236"),
            text("$142", "$142"),
            text("80% 选择", "80% choose"),
          ],
          [
            text("2000 - 3000 尺 / 4 小时", "2000 - 3000 sq ft / 4 hours"),
            text("$280", "$280"),
            text("$768", "$768"),
            text("$72", "$72"),
            text("$1508", "$1508"),
            text("$172", "$172"),
            text("-", "-"),
          ],
        ],
        note: text(
          "次卡购买起 12 个月内有效，未使用次数可申请退款，扣除 $30 手续费；已使用次数按单次原价扣除。",
          "Passes are valid for 12 months. Unused visits may be refunded with a $30 processing fee; used visits are deducted at the single-visit price."
        ),
      },
    ],
  },
  {
    id: "bayArea",
    name: text("湾区", "Bay Area"),
    description: text(
      "覆盖旧金山、圣何塞、Cupertino、Sunnyvale、Fremont、Palo Alto 等区域，部分地址需客服确认。",
      "Covers San Francisco, San Jose, Cupertino, Sunnyvale, Fremont, Palo Alto, and more, subject to support confirmation."
    ),
    sections: [
      {
        title: text("日常保洁", "Regular cleaning"),
        columns: [
          text("参考时间", "Reference time"),
          text("参考面积", "Reference area"),
          text("预估价格", "Estimated price"),
        ],
        rows: [
          [
            text("2 小时内", "Within 2 hours"),
            text("1000 尺以内", "Within 1000 sq ft"),
            text("$170", "$170"),
          ],
          [
            text("3 小时内", "Within 3 hours"),
            text("1000 尺 - 2000 尺以内", "1000 - 2000 sq ft"),
            text("$260", "$260"),
          ],
          [
            text("4 小时内", "Within 4 hours"),
            text("2000 尺 - 3000 尺以内", "2000 - 3000 sq ft"),
            text("$320", "$320"),
          ],
          [
            text("5 小时内", "Within 5 hours"),
            text("3000 尺 - 4000 尺以内", "3000 - 4000 sq ft"),
            text("$400", "$400"),
          ],
        ],
      },
      {
        title: text("深度保洁", "Deep cleaning"),
        columns: [
          text("参考时间", "Reference time"),
          text("参考面积", "Reference area"),
          text("预估价格", "Estimated price"),
        ],
        rows: [
          [
            text("3 小时内", "Within 3 hours"),
            text("1000 尺以内", "Within 1000 sq ft"),
            text("$320", "$320"),
          ],
          [
            text("4 小时内", "Within 4 hours"),
            text("1000 尺 - 2000 尺以内", "1000 - 2000 sq ft"),
            text("$430", "$430"),
          ],
          [
            text("5 小时内", "Within 5 hours"),
            text("2000 尺 - 3000 尺以内", "2000 - 3000 sq ft"),
            text("$540", "$540"),
          ],
          [
            text("6 小时内", "Within 6 hours"),
            text("3000 尺 - 4000 尺以内", "3000 - 4000 sq ft"),
            text("$630", "$630"),
          ],
        ],
      },
      {
        title: text("开荒和退租", "Post-renovation and move-out"),
        columns: [
          text("参考时间", "Reference time"),
          text("参考面积", "Reference area"),
          text("预估价格", "Estimated price"),
        ],
        rows: [
          [
            text("3 小时内", "Within 3 hours"),
            text("1000 尺以内", "Within 1000 sq ft"),
            text("$370", "$370"),
          ],
          [
            text("4 小时内", "Within 4 hours"),
            text("1000 尺 - 2000 尺以内", "1000 - 2000 sq ft"),
            text("$480", "$480"),
          ],
          [
            text("5 小时内", "Within 5 hours"),
            text("2000 尺 - 3000 尺以内", "2000 - 3000 sq ft"),
            text("$630", "$630"),
          ],
          [
            text("6 小时内", "Within 6 hours"),
            text("3000 尺 - 4000 尺以内", "3000 - 4000 sq ft"),
            text("$720", "$720"),
          ],
        ],
        note: text(
          "如果客户描述和现场差异过大，现场评估价格会酌情上浮 10% - 25% 不等。",
          "If the on-site condition differs significantly from the submitted details, the final price may increase by 10% - 25%."
        ),
      },
      {
        title: text("附加项目", "Add-ons"),
        columns: [text("项目", "Item"), text("价格", "Price")],
        rows: [
          [text("玻璃窗", "Windows"), text("$15/个", "$15 each")],
          [text("冰箱", "Fridge"), text("$30-50", "$30-50")],
          [
            text("高温地毯清洗", "Steam carpet cleaning"),
            text("$45-60/房", "$45-60 / room"),
          ],
          [text("车库", "Garage"), text("$30-50", "$30-50")],
        ],
      },
    ],
  },
  {
    id: "seattle",
    name: text("西雅图", "Seattle"),
    description: text(
      "覆盖大西雅图地区，包含 Seattle、Bellevue、Redmond、Kirkland、Renton 等区域。",
      "Covers Greater Seattle, including Seattle, Bellevue, Redmond, Kirkland, Renton, and nearby areas."
    ),
    sections: [
      {
        title: text("日常保洁", "Regular cleaning"),
        columns: [
          text("预计到场时长", "On-site duration"),
          text("合计服务工时", "Total labor hours"),
          text("参考面积", "Reference area"),
          text("预估价格", "Estimated price"),
          text("人员", "Staffing"),
        ],
        rows: [
          [
            text("2 小时", "2 hours"),
            text("共 4 小时", "4 total hours"),
            text("1000 尺以内", "Within 1000 sq ft"),
            text("$208", "$208"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("3 小时", "3 hours"),
            text("共 6 小时", "6 total hours"),
            text("1000 尺 - 2000 尺", "1000 - 2000 sq ft"),
            text("$308", "$308"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("4 小时", "4 hours"),
            text("共 8 小时", "8 total hours"),
            text("2000 尺 - 3000 尺", "2000 - 3000 sq ft"),
            text("$408", "$408"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("5 小时", "5 hours"),
            text("共 10 小时", "10 total hours"),
            text("3000 尺 - 4000 尺", "3000 - 4000 sq ft"),
            text("$508", "$508"),
            text("两位阿姨", "2 cleaners"),
          ],
        ],
      },
      {
        title: text("深度保洁", "Deep cleaning"),
        columns: [
          text("预计到场时长", "On-site duration"),
          text("合计服务工时", "Total labor hours"),
          text("参考面积", "Reference area"),
          text("预估价格", "Estimated price"),
          text("人员", "Staffing"),
        ],
        rows: [
          [
            text("3 小时", "3 hours"),
            text("共 6 小时", "6 total hours"),
            text("1000 尺以内", "Within 1000 sq ft"),
            text("$328", "$328"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("4 小时", "4 hours"),
            text("共 8 小时", "8 total hours"),
            text("1000 尺 - 2000 尺", "1000 - 2000 sq ft"),
            text("$438", "$438"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("5 小时", "5 hours"),
            text("共 10 小时", "10 total hours"),
            text("2000 尺 - 3000 尺", "2000 - 3000 sq ft"),
            text("$548", "$548"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("6 小时", "6 hours"),
            text("共 12 小时", "12 total hours"),
            text("3000 尺 - 4000 尺", "3000 - 4000 sq ft"),
            text("$658", "$658"),
            text("两位阿姨", "2 cleaners"),
          ],
        ],
      },
      {
        title: text("开荒和退租", "Post-renovation and move-out"),
        columns: [
          text("参考时间", "Reference time"),
          text("合计服务工时", "Total labor hours"),
          text("参考面积", "Reference area"),
          text("预估价格", "Estimated price"),
          text("人员 / 标签", "Staffing / tag"),
        ],
        rows: [
          [
            text("3 小时", "3 hours"),
            text("共 6 小时", "6 total hours"),
            text("500 - 700 英尺", "500 - 700 sq ft"),
            text("$288", "$288"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("4 小时", "4 hours"),
            text("共 8 小时", "8 total hours"),
            text("1000 - 1500 英尺", "1000 - 1500 sq ft"),
            text("$368", "$368"),
            text("留学必选", "Student pick"),
          ],
          [
            text("5 小时", "5 hours"),
            text("共 10 小时", "10 total hours"),
            text("1500 - 2000 英尺", "1500 - 2000 sq ft"),
            text("$448", "$448"),
            text("两位阿姨", "2 cleaners"),
          ],
          [
            text("6 小时", "6 hours"),
            text("共 12 小时", "12 total hours"),
            text("2000 - 2500 英尺", "2000 - 2500 sq ft"),
            text("$528", "$528"),
            text("两位阿姨", "2 cleaners"),
          ],
        ],
      },
      {
        title: text("附加项目", "Add-ons"),
        columns: [
          text("项目", "Item"),
          text("价格", "Price"),
          text("标签", "Tag"),
        ],
        rows: [
          [
            text("玻璃窗", "Windows"),
            text("$15/个", "$15 each"),
            text("热门加购", "Popular"),
          ],
          [
            text("地毯清洗", "Carpet cleaning"),
            text("$45-60/房", "$45-60 / room"),
            text("-", "-"),
          ],
          [text("冰箱", "Fridge"), text("$30-50", "$30-50"), text("-", "-")],
          [text("车库", "Garage"), text("$30-50", "$30-50"), text("-", "-")],
        ],
      },
    ],
  },
  {
    id: "boston",
    name: text("波士顿", "Boston"),
    description: text(
      "覆盖波士顿及周边学生/华人居住区，包含 Cambridge、Brookline、Quincy、Malden、Newton 等区域。",
      "Covers Boston and nearby student / Chinese communities, including Cambridge, Brookline, Quincy, Malden, Newton, and more."
    ),
    sections: [
      {
        title: text("清洁内容", "Cleaning scope"),
        columns: [text("服务类型", "Service type"), text("清洁内容", "Scope")],
        rows: [
          [
            text("常规清洁内容", "Regular scope"),
            text(
              "地板/踢脚线、台面、家具表面、生活垃圾清理、墙面去污、电器表面、橱柜外部、水槽、马桶、浴缸、洗手台、镜面",
              "Floors/baseboards, counters, furniture surfaces, trash removal, wall spot cleaning, appliance exteriors, cabinet exteriors, sink, toilet, tub, vanity, mirrors"
            ),
          ],
          [
            text("深度清洁增加内容", "Deep cleaning adds"),
            text(
              "电器内部、橱柜内部、消毒杀菌、更深层清洁",
              "Appliance interiors, cabinet interiors, disinfection, and more detailed cleaning"
            ),
          ],
        ],
      },
      {
        title: text("公寓价格", "Apartment pricing"),
        columns: [
          text("通用面积 / 户型", "Area / home type"),
          text("日常清洁", "Regular cleaning"),
          text("深度清洁", "Deep cleaning"),
        ],
        rows: [
          [
            text("Studio", "Studio"),
            text("$108 / 2 小时", "$108 / 2 hours"),
            text("$118 / 2 小时", "$118 / 2 hours"),
          ],
          [
            text("1B1B", "1B1B"),
            text("$138 / 2.5 小时", "$138 / 2.5 hours"),
            text("$178 / 3 小时", "$178 / 3 hours"),
          ],
          [
            text("2B1B", "2B1B"),
            text("$168 / 3 小时", "$168 / 3 hours"),
            text("$208 / 3.5 小时", "$208 / 3.5 hours"),
          ],
          [
            text("2B2B", "2B2B"),
            text("$188 / 3.5 小时", "$188 / 3.5 hours"),
            text("$238 / 4 小时", "$238 / 4 hours"),
          ],
          [
            text("3B2B", "3B2B"),
            text("$218 / 4 小时", "$218 / 4 hours"),
            text("$268 / 5 小时", "$268 / 5 hours"),
          ],
        ],
      },
      {
        title: text("家庭价格", "House pricing"),
        columns: [
          text("通用面积", "Area"),
          text("日常清洁", "Regular cleaning"),
          text("深度清洁", "Deep cleaning"),
        ],
        rows: [
          [
            text("1000 尺内", "Within 1000 sq ft"),
            text("$108 / 2 小时", "$108 / 2 hours"),
            text("$178 / 3 小时", "$178 / 3 hours"),
          ],
          [
            text("1000 - 1400 尺", "1000 - 1400 sq ft"),
            text("$188 / 3.5 小时", "$188 / 3.5 hours"),
            text("$268 / 4.5 小时", "$268 / 4.5 hours"),
          ],
          [
            text("1400 - 2000 尺", "1400 - 2000 sq ft"),
            text("$218 / 4 小时", "$218 / 4 hours"),
            text("$298 / 5 小时", "$298 / 5 hours"),
          ],
        ],
      },
      {
        title: text("附加项目", "Add-ons"),
        columns: [text("项目", "Item"), text("价格", "Price")],
        rows: [
          [
            text("高温地板", "Steam floor cleaning"),
            text("$20/房", "$20 / room"),
          ],
          [
            text("高温地毯", "Steam carpet cleaning"),
            text("$30/房", "$30 / room"),
          ],
        ],
        note: text(
          "表格面积仅作为时长预估参考，实际统一按服务时长计费；一个阿姨超时半小时收费 $30。本表价格均为 1 位阿姨上门服务价格。",
          "Area is only a time reference; service is billed by duration. Overtime is $30 per half hour per cleaner. Boston prices listed are for one cleaner."
        ),
      },
    ],
  },
]

const initialFormState: BookingFormState = {
  bathrooms: "",
  bedrooms: "",
  contact: "",
  fullName: "",
  notes: "",
  preferredDate: "",
  serviceAddress: "",
  serviceArea: "",
  serviceType: "",
}

function BookingPage() {
  return <BookingRequestSection />
}

function BookingRequestSection() {
  const { cityName, language, regionName } = useI18n()
  const copy = bookingCopy[language]
  const [form, setForm] = useState<BookingFormState>(initialFormState)
  const mobileCopy = mobileBookingCopy[language]
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [needsQuote, setNeedsQuote] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activePricingCity, setActivePricingCity] =
    useState<PricingCityId>("losAngeles")
  const [submitError, setSubmitError] = useState("")
  const estimate = useMemo(
    () =>
      getPriceEstimate({
        bathrooms: form.bathrooms,
        bedrooms: form.bedrooms,
        language,
        serviceType: form.serviceType,
      }),
    [form.bathrooms, form.bedrooms, form.serviceType, language]
  )

  useEffect(() => {
    const cachedContact = readCachedBookingContact()

    if (!cachedContact) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        contact: current.contact || cachedContact.contact,
        fullName: current.fullName || cachedContact.fullName,
        serviceAddress: current.serviceAddress || cachedContact.serviceAddress,
        serviceArea: current.serviceArea || cachedContact.serviceArea,
      }))
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function updateForm<TField extends keyof BookingFormState>(
    field: TField,
    value: BookingFormState[TField]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setIsSubmitted(false)
    setNeedsQuote(false)
    setSubmitError("")
  }

  function updateCachedContactField<TField extends keyof BookingContactFields>(
    field: TField,
    value: BookingContactFields[TField]
  ) {
    updateForm(field, value)
    writeCachedBookingContact({
      ...pickBookingContactFields(form),
      [field]: value,
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      if (!hasRequiredBookingFields(form)) {
        setSubmitError(getRequiredBookingMessage(language))
        setIsSubmitted(false)
        return
      }

      if (!estimate) {
        setNeedsQuote(true)
        setIsSubmitted(false)
        return
      }

      // Showcase mode: keep the booking form for demo only.
      // No payment order is created and no backend call is made.
      await Promise.resolve()
      setIsSubmitted(true)
      setNeedsQuote(false)
      setForm(initialFormState)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : copy.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      data-scroll-reveal="false"
      className="relative overflow-hidden px-4 py-8 transition-colors duration-300 sm:px-6 md:px-8 md:py-14"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(148,163,184,0.16),transparent_26%)] dark:bg-[radial-gradient(circle_at_14%_16%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(37,99,235,0.14),transparent_26%)]" />
      <div className="relative mx-auto max-w-3xl">
        <Card className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-card/90 p-4 shadow-xl shadow-blue-100/55 sm:p-6 md:p-8 dark:bg-slate-900/80 dark:shadow-blue-950/25">
          <form onSubmit={handleSubmit}>
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-border pb-5 dark:border-white/10">
              <div>
                <div className="text-xs font-semibold tracking-[0.16em] text-primary uppercase dark:text-blue-300">
                  {copy.kicker}
                </div>
                <h2 className="text-base leading-tight font-semibold tracking-[-0.02em] text-slate-950 md:mt-1 md:text-xl dark:text-white">
                  {copy.formTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {copy.formDescription}
                </p>
              </div>
              <PricingDialog
                activeCity={activePricingCity}
                copy={copy}
                language={language}
                onActiveCityChange={setActivePricingCity}
              />
            </div>

            <div className="booking-mobile-compact grid gap-3">
              <FormField
                htmlFor="serviceArea"
                label={copy.serviceArea}
                required
              >
                <Select
                  name="serviceArea"
                  onValueChange={(value) =>
                    updateCachedContactField("serviceArea", value)
                  }
                  required
                  value={form.serviceArea}
                >
                  <SelectTrigger
                    className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3 md:text-sm"
                    id="serviceArea"
                  >
                    <SelectValue placeholder={copy.serviceArea} />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceRegions.map((region) => (
                      <SelectGroup key={region.id}>
                        <SelectLabel>{regionName(region.name)}</SelectLabel>
                        {region.cities.map((city) => {
                          const value = `${city} · ${region.name}`

                          return (
                            <SelectItem
                              key={`${region.id}-${city}`}
                              value={value}
                            >
                              {cityName(city)} · {regionName(region.name)}
                            </SelectItem>
                          )
                        })}
                      </SelectGroup>
                    ))}
                    <SelectItem value={copy.otherCity}>
                      {copy.otherCity}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                htmlFor="serviceAddress"
                label={copy.serviceAddress}
                required
              >
                <Input
                  className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3.5 md:text-sm"
                  id="serviceAddress"
                  name="serviceAddress"
                  onChange={(event) =>
                    updateCachedContactField(
                      "serviceAddress",
                      event.target.value
                    )
                  }
                  placeholder={copy.serviceAddress}
                  required
                  value={form.serviceAddress}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  htmlFor="serviceType"
                  label={copy.serviceType}
                  required
                >
                  <Select
                    name="serviceType"
                    onValueChange={(value) => updateForm("serviceType", value)}
                    required
                    value={form.serviceType}
                  >
                    <SelectTrigger
                      className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3 md:text-sm"
                      id="serviceType"
                    >
                      <SelectValue placeholder={copy.serviceType} />
                    </SelectTrigger>
                    <SelectContent>
                      {copy.serviceTypes.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  htmlFor="preferredDate"
                  label={copy.preferredDate}
                  required
                >
                  <Input
                    className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3.5 md:text-sm"
                    id="preferredDate"
                    name="preferredDate"
                    onChange={(event) =>
                      updateForm("preferredDate", event.target.value)
                    }
                    required
                    type="date"
                    value={form.preferredDate}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField htmlFor="bedrooms" label={copy.bedrooms} required>
                  <Input
                    className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3.5 md:text-sm"
                    id="bedrooms"
                    min="0"
                    name="bedrooms"
                    onChange={(event) =>
                      updateForm("bedrooms", event.target.value)
                    }
                    placeholder="2"
                    required
                    step="1"
                    type="number"
                    value={form.bedrooms}
                  />
                </FormField>

                <FormField htmlFor="bathrooms" label={copy.bathrooms} required>
                  <Input
                    className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3.5 md:text-sm"
                    id="bathrooms"
                    min="0"
                    name="bathrooms"
                    onChange={(event) =>
                      updateForm("bathrooms", event.target.value)
                    }
                    placeholder="1.5"
                    required
                    step="0.5"
                    type="number"
                    value={form.bathrooms}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField htmlFor="fullName" label={copy.fullName}>
                  <Input
                    className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3.5 md:text-sm"
                    id="fullName"
                    name="fullName"
                    onChange={(event) =>
                      updateCachedContactField("fullName", event.target.value)
                    }
                    placeholder={copy.fullName}
                    value={form.fullName}
                  />
                </FormField>

                <FormField htmlFor="contact" label={copy.contact} required>
                  <Input
                    className="h-8 rounded-md px-2.5 text-xs md:h-9 md:px-3.5 md:text-sm"
                    id="contact"
                    name="contact"
                    onChange={(event) =>
                      updateCachedContactField("contact", event.target.value)
                    }
                    placeholder={copy.contact}
                    required
                    value={form.contact}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <PriceEstimatePanel
                  compact
                  compactEmptyLabel={mobileCopy.priceAuto}
                  copy={copy}
                  estimate={estimate}
                  hasInputs={Boolean(
                    form.serviceType && form.bedrooms && form.bathrooms
                  )}
                />
                <div className="flex items-end">
                  <AddOnServicesPopover copy={copy} language={language} />
                </div>
              </div>

              <FormField htmlFor="notes" label={copy.details}>
                <Textarea
                  className="min-h-9 rounded-md px-2.5 py-2 text-xs md:min-h-20 md:px-3.5 md:text-sm"
                  id="notes"
                  name="notes"
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder={copy.details}
                  value={form.notes}
                />
              </FormField>
            </div>

            <div className="mt-6 space-y-3 border-t border-border pt-5 dark:border-white/10">
              {needsQuote ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="font-medium">{copy.quoteRequiredTitle}</div>
                  <div className="mt-1">{copy.quoteRequired}</div>
                  <Button
                    asChild
                    className="mt-3 h-9 rounded-md"
                    size="sm"
                    variant="outline"
                  >
                    <Link to="/contact">{copy.quoteRequiredAction}</Link>
                  </Button>
                </div>
              ) : null}
              {isSubmitted ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
                  {copy.success}
                </div>
              ) : null}
              {submitError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">
                  {submitError}
                </div>
              ) : null}

              <p className="text-center text-[11px] leading-5 text-slate-500 md:text-left md:text-xs dark:text-slate-400">
                {copy.legalNotice}{" "}
                <Link
                  className="font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-300"
                  to="/privacy"
                >
                  {copy.privacy}
                </Link>{" "}
                /{" "}
                <Link
                  className="font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-300"
                  to="/terms"
                >
                  {copy.terms}
                </Link>
              </p>

              <Button
                className="h-10 w-full rounded-full text-sm font-semibold md:h-10 md:rounded-md"
                disabled={isSubmitting}
                type="submit"
                variant="brand"
              >
                {isSubmitting
                  ? copy.submitting
                  : isSubmitted
                    ? copy.submitted
                    : estimate
                      ? copy.submit
                      : copy.quoteRequiredAction}
                <PaperPlaneTilt weight="fill" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </section>
  )
}

type BookingContactFields = Pick<
  BookingFormState,
  "contact" | "fullName" | "serviceAddress" | "serviceArea"
>

function PricingDialog({
  activeCity,
  copy,
  language,
  onActiveCityChange,
}: {
  activeCity: PricingCityId
  copy: BookingCopy
  language: Language
  onActiveCityChange: (city: PricingCityId) => void
}) {
  const activeTable =
    cityPricingTables.find((table) => table.id === activeCity) ??
    cityPricingTables[0]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-8 shrink-0 rounded-md px-2 text-xs md:mt-0.5 md:h-9 md:px-3 md:text-sm"
          type="button"
          variant="outline"
        >
          <SquaresFour size={17} weight="bold" />
          {copy.priceDialogAction}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-4 pr-12 sm:px-6 dark:border-white/10">
          <DialogTitle>{copy.priceDialogTitle}</DialogTitle>
          <DialogDescription className="leading-6">
            {copy.priceDialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-4 py-4 sm:px-6">
          <div className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
            {copy.priceDialogCityLabel}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cityPricingTables.map((table) => {
              const isActive = table.id === activeTable.id

              return (
                <Button
                  className={cn(
                    "h-9 rounded-md px-2 text-xs sm:text-sm",
                    isActive && "border-primary"
                  )}
                  key={table.id}
                  onClick={() => onActiveCityChange(table.id)}
                  type="button"
                  variant={isActive ? "brand" : "outline"}
                >
                  {table.name[language]}
                </Button>
              )
            })}
          </div>

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-sm leading-6 text-slate-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-slate-200">
            <div className="font-semibold text-slate-950 dark:text-white">
              {activeTable.name[language]}
            </div>
            <div className="mt-1">{activeTable.description[language]}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {copy.priceDialogNote}
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {activeTable.sections.map((section) => (
              <section
                className="overflow-hidden rounded-lg border border-border bg-card/70 dark:border-white/10 dark:bg-white/[0.03]"
                key={section.title.zh}
              >
                <div className="border-b border-border px-3 py-2.5 text-sm font-semibold text-slate-950 dark:border-white/10 dark:text-white">
                  {section.title[language]}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {section.columns.map((column) => (
                        <TableHead key={column.zh}>
                          {column[language]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.rows.map((row, rowIndex) => (
                      <TableRow key={`${section.title.zh}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <TableCell
                            className={cn(
                              "text-xs leading-5 sm:text-sm",
                              cellIndex === 0 &&
                                "font-medium text-slate-900 dark:text-slate-100",
                              cell[language].length > 44 &&
                                "min-w-[18rem] whitespace-normal"
                            )}
                            key={`${section.title.zh}-${rowIndex}-${cellIndex}`}
                          >
                            {cell[language]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {section.note ? (
                  <div className="border-t border-border px-3 py-2 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {section.note[language]}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function pickBookingContactFields(
  form: BookingFormState
): BookingContactFields {
  return {
    contact: form.contact,
    fullName: form.fullName,
    serviceAddress: form.serviceAddress,
    serviceArea: form.serviceArea,
  }
}

function readCachedBookingContact(): BookingContactFields | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(bookingContactStorageKey)

    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as Partial<BookingContactFields>

    return {
      contact: normalizeCachedText(parsed.contact),
      fullName: normalizeCachedText(parsed.fullName),
      serviceAddress: normalizeCachedText(parsed.serviceAddress),
      serviceArea: normalizeCachedText(parsed.serviceArea),
    }
  } catch {
    return null
  }
}

function writeCachedBookingContact(fields: BookingContactFields) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(
      bookingContactStorageKey,
      JSON.stringify(fields)
    )
  } catch {
    // Ignore storage failures, for example private browsing quota limits.
  }
}

function normalizeCachedText(value: unknown) {
  return typeof value === "string" ? value : ""
}

function hasRequiredBookingFields(form: BookingFormState) {
  return Boolean(
    form.serviceArea.trim() &&
    form.serviceAddress.trim() &&
    form.serviceType.trim() &&
    form.bedrooms.trim() &&
    form.bathrooms.trim() &&
    form.preferredDate.trim() &&
    form.contact.trim()
  )
}

function getRequiredBookingMessage(language: Language) {
  return language === "zh"
    ? "请先补全服务地址、联系方式、清洁需求、预约日期和房型信息。"
    : "Please complete the address, contact, service, date, and home details first."
}

function AddOnServicesPopover({
  copy,
  language,
}: {
  copy: BookingCopy
  language: Language
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-8 w-full justify-start rounded-md px-2.5 text-xs md:h-9 md:px-3 md:text-sm"
          type="button"
          variant="outline"
        >
          <Broom size={15} weight="bold" />
          {copy.addOnTitle}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] p-2.5"
      >
        <div className="mb-2.5 text-sm font-semibold text-slate-950 dark:text-white">
          {copy.addOnTitle}
        </div>
        <div className="grid gap-1.5">
          {addOnServices.map((service) => {
            const IconComponent = service.icon

            return (
              <div
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border bg-card/70 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.04]"
                key={service.label.zh}
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
                  <IconComponent size={15} weight="bold" />
                </span>
                <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                  {service.label[language]}
                </span>
                <span className="text-xs font-semibold whitespace-nowrap text-blue-700 dark:text-blue-200">
                  {service.price}
                </span>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PriceEstimatePanel({
  compact,
  compactEmptyLabel,
  copy,
  estimate,
  hasInputs,
}: {
  compact?: boolean
  compactEmptyLabel?: string
  copy: BookingCopy
  estimate: PriceEstimate | null
  hasInputs: boolean
}) {
  if (compact) {
    return (
      <div className="flex h-9 min-w-0 items-center justify-between gap-3 rounded-md border border-blue-100 bg-blue-50/70 px-3 text-sm dark:border-blue-400/20 dark:bg-blue-500/10">
        <span className="min-w-0 truncate font-semibold text-slate-900 dark:text-white">
          {copy.estimateTitle}
        </span>
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
          {estimate
            ? `${estimate.price} · ${estimate.time}`
            : hasInputs
              ? copy.estimateCustom
              : (compactEmptyLabel ?? copy.estimateEmpty)}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 sm:col-span-2 dark:border-blue-400/20 dark:bg-blue-500/10">
      <div className="text-sm font-semibold text-slate-950 dark:text-white">
        {copy.estimateTitle}
      </div>
      {estimate ? (
        <div className="mt-2.5 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {estimate.label}
            </div>
            <div className="mt-0.5 font-semibold text-slate-950 dark:text-white">
              {estimate.time}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Price
            </div>
            <div className="mt-0.5 text-lg font-bold text-blue-700 dark:text-blue-200">
              {estimate.price}
            </div>
          </div>
          <div className="text-xs leading-5 text-slate-600 sm:col-span-1 dark:text-slate-300">
            {copy.estimateNote}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {hasInputs ? copy.estimateCustom : copy.estimateEmpty}
        </p>
      )}
    </div>
  )
}

function getPriceEstimate({
  bathrooms,
  bedrooms,
  language,
  serviceType,
}: {
  bathrooms: string
  bedrooms: string
  language: Language
  serviceType: string
}): PriceEstimate | null {
  const pricingKey = getPricingKey(serviceType)
  const bedroomCount = Number(bedrooms)
  const bathroomCount = Number(bathrooms)

  if (
    !pricingKey ||
    !Number.isFinite(bedroomCount) ||
    !Number.isFinite(bathroomCount) ||
    bedroomCount <= 0 ||
    bathroomCount <= 0
  ) {
    return null
  }

  const tier = pricingTable[pricingKey].find(
    (item) =>
      bedroomCount <= item.maxBedrooms && bathroomCount <= item.maxBathrooms
  )

  if (!tier) {
    return null
  }

  return {
    label: tier.label,
    price: tier.price,
    time: tier.time[language],
  }
}

function getPricingKey(serviceType: string) {
  const normalized = serviceType.toLowerCase()

  if (normalized.includes("日常") || normalized.includes("regular")) {
    return "regular" as const
  }

  if (normalized.includes("深度") || normalized.includes("deep")) {
    return "deep" as const
  }

  if (
    normalized.includes("退租") ||
    normalized.includes("开荒") ||
    normalized.includes("move-out") ||
    normalized.includes("post-renovation")
  ) {
    return "moveOut" as const
  }

  return null
}

export { BookingPage }
