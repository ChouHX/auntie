/**
 * Domestic (China mainland) legal entity for the showcase site.
 */
export const companyIdentity = {
  legalName: "杭州陈阿姨到家品牌管理有限公司",
  brandNameZh: "陈阿姨到家",
  brandNameEn: "Auntie Chen Home",
  registrationPlace: "中国 · 浙江杭州",
  registeredOffice:
    "浙江省杭州市余杭区仓前街道文一西路1218号4幢501-11室",
  contactEmail: "auntiechenhome@gmail.com",
  /** Phone is intentionally not published on this site. */
  contactPhone: "",
  customerServiceHours: "每天 9:00 - 21:00",
  website: "https://example.com",
} as const

export type CompanyIdentity = typeof companyIdentity
