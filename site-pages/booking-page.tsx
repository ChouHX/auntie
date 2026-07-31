import { type FormEvent, useMemo, useState } from "react"
import {
  ChatCircleText,
  Check,
  ClipboardText,
  EnvelopeSimple,
  Info,
  PhoneCall,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react"
import { ChevronLeft, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { Link } from "@/lib/router-compat"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FooterContactBlock } from "@/components/marketing/site-footer"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
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
import { Skeleton } from "@/components/ui/skeleton"
import { defaultCmsContent, defaultContactPage } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { regionsWithDerivedCities } from "@/lib/service-regions"
import { createBookingOrder } from "@/lib/cms-api"
import { useI18n, type Language } from "@/lib/i18n"
import type { CmsPaymentOrder } from "@/types/cms"

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

const bookingCopy: Record<Language, BookingCopy> = {
  zh: {
    bathrooms: "卫生间数量",
    bedrooms: "卧室数量",
    contact: "联系方式（电话 / 邮箱 / 微信至少一种）",
    details: "备注",
    estimateCustom: "该户型或服务类型需要客服确认参考价格",
    estimateEmpty: "选择服务类型并输入卧室、卫生间数量后显示参考价。",
    estimateNote:
      "仅供预估参考，不会写入预约订单。最终费用由客服根据城市、房屋状态和服务细节确认。",
    estimateTitle: "参考时间与预估价格",
    formDescription:
      "填写预约需求后，客服会与您确认服务细节、费用和阿姨安排。此步骤不会生成付款链接。",
    formTitle: "提交预约需求",
    fullName: "联系人姓名 / 称呼",
    heroDescription:
      "请填写服务区域、房屋信息和清洁需求。提交后添加企业微信客服，由客服确认服务方案、费用和阿姨安排。",
    heroTitle: "预约清洁服务",
    kicker: "Booking",
    legalNotice: "提交即表示你同意",
    otherCity: "咨询其他城市",
    preferredDate: "期望预约日期",
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
    submitError: "提交失败，请稍后再试，或直接通过电话 / 微信联系我们。",
    submitted: "预约需求已提交",
    submitting: "发送中...",
    success:
      "预约需求已提交。请添加企业微信客服，并提供订单号以确认服务细节、费用和阿姨安排。",
    terms: "服务条款",
    phoneTitle: "需要更快沟通？",
    phoneText: "可先电话或企业微信联系，表单信息后续可同步给客服。",
  },
  en: {
    bathrooms: "Bathrooms",
    bedrooms: "Bedrooms",
    contact: "Contact method (phone / email / WeChat, at least one)",
    details: "Notes",
    estimateCustom: "Contact support for a reference price for this request",
    estimateEmpty:
      "Select a service type and enter bedrooms and bathrooms to see a reference price.",
    estimateNote:
      "For reference only and not saved as the booking amount. Support will confirm the final price based on location, home condition, and service details.",
    estimateTitle: "Reference time and estimated price",
    formDescription:
      "Submit your booking request and support will confirm the service details, price, and auntie assignment. No payment link is created at this step.",
    formTitle: "Submit a booking request",
    fullName: "Contact name / nickname",
    heroDescription:
      "Share your service area, home details, and cleaning needs. Then add our WeCom support to confirm the plan, price, and auntie assignment.",
    heroTitle: "Book Cleaning Service",
    kicker: "Booking",
    legalNotice: "By submitting, you agree to the",
    otherCity: "Ask about another city",
    preferredDate: "Preferred service date",
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
      "Your request has been submitted. Add our WeCom support and share the order number to confirm service details, price, and auntie assignment.",
    terms: "Terms of Service",
    phoneTitle: "Need faster help?",
    phoneText:
      "You can contact us by phone or WeCom first, then share the form details with support.",
  },
}

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
  const { language } = useI18n()
  const { content, isLoading } = useCmsContent([
    "contactPage",
    "paymentSettings",
  ])

  if (isLoading) {
    return <BookingAvailabilityLoading />
  }

  if (!content.paymentSettings.enabled) {
    const contactSettings =
      content.contactPage?.[language] ?? defaultContactPage[language]

    return (
      <BookingPaymentDisabled
        contactEmail={contactSettings.contactEmail}
        contactPhone={contactSettings.contactPhone}
        contactQrImage={contactSettings.qrImage}
        language={language}
      />
    )
  }

  return <BookingRequestSection />
}

function BookingAvailabilityLoading() {
  return (
    <section className="pt-[calc(60px+2rem)] pb-12 md:pt-[calc(72px+3rem)]">
      <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </section>
  )
}

function BookingPaymentDisabled({
  contactEmail,
  contactPhone,
  contactQrImage,
  language,
}: {
  contactEmail: string
  contactPhone: string
  contactQrImage: string
  language: Language
}) {
  const isZh = language === "zh"

  return (
    <section className="relative overflow-hidden pt-[calc(60px+2rem)] pb-12 md:pt-[calc(72px+3rem)] md:pb-16">
      <div className="relative mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
        <Card className="animate-fade-up border-blue-200 bg-blue-50/80 p-5 shadow-lg shadow-blue-950/5 sm:p-6 dark:border-blue-400/20 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-blue-500">
              <Info size={20} weight="bold" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-950 dark:text-white">
                {isZh ? "预约请联系企业微信客服" : "Contact WeCom to book"}
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {isZh
                  ? "如需预约，请扫描下方二维码添加企业微信客服。网站目前仅用于服务完成后的订单付款。"
                  : "To make a booking, scan the QR code below and add our WeCom support. The website is currently only used for payment after a service is completed."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="animate-fade-up p-5 shadow-lg shadow-blue-950/5 sm:p-6">
          <FooterContactBlock
            contactDescription={
              isZh
                ? "建议优先扫码添加企业微信客服，我们会协助确认服务范围与可预约时间。"
                : "Scan the QR code to add our WeCom support team. We will help confirm the service scope and availability."
            }
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            contactQrImage={contactQrImage}
            title={isZh ? "联系我们" : "Contact Us"}
          />
        </Card>
      </div>
    </section>
  )
}

function BookingRequestSection() {
  const { cityName, language, regionName } = useI18n()
  const { content } = useCmsContent([
    "contactPage",
    "serviceLocations",
    "serviceRegions",
  ])
  const copy = bookingCopy[language]
  const contactSettings =
    content.contactPage?.[language] ?? defaultContactPage[language]
  const contactQrImage =
    contactSettings.qrImage || defaultContactPage[language].qrImage
  const contactPhone =
    contactSettings.contactPhone || defaultContactPage[language].contactPhone
  const contactEmail =
    contactSettings.contactEmail || defaultContactPage[language].contactEmail
  const [form, setForm] = useState<BookingFormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submittedOrder, setSubmittedOrder] = useState<CmsPaymentOrder | null>(
    null
  )
  const minimumServiceDate = getLocalDateKey()
  const serviceRegions = useMemo(
    () =>
      regionsWithDerivedCities(
        content.serviceRegions ?? defaultCmsContent.serviceRegions,
        content.serviceLocations ?? defaultCmsContent.serviceLocations
      ),
    [content.serviceLocations, content.serviceRegions]
  )
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
  function updateForm<TField extends keyof BookingFormState>(
    field: TField,
    value: BookingFormState[TField]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setSubmitError("")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isAvailableServiceDate(form.preferredDate, minimumServiceDate)) {
      setSubmitError(
        language === "zh"
          ? "预约日期不能早于今天，请重新选择。"
          : "The service date cannot be earlier than today."
      )
      return
    }
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const result = await createBookingOrder({
        bathrooms: form.bathrooms,
        bedrooms: form.bedrooms,
        contact: form.contact,
        customerName: form.fullName,
        note: form.notes,
        serviceAddress: form.serviceAddress,
        serviceArea: form.serviceArea,
        serviceDate: form.preferredDate,
        serviceType: form.serviceType,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      })
      setSubmittedOrder(result.order)
      setForm(initialFormState)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : copy.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedOrder) {
    return (
      <BookingSuccessPage
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        copy={copy}
        language={language}
        order={submittedOrder}
        qrImage={contactQrImage}
      />
    )
  }

  return (
    <section
      data-scroll-reveal="false"
      className="relative overflow-hidden pt-[calc(60px+1.5rem)] pb-10 transition-colors duration-300 sm:pt-[calc(60px+2.5rem)] sm:pb-14 md:pt-[calc(72px+2.5rem)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(148,163,184,0.16),transparent_26%)] dark:bg-[radial-gradient(circle_at_14%_16%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(37,99,235,0.14),transparent_26%)]" />
      <div className="relative md:hidden">
        <MobileBookingFlow
          copy={copy}
          estimate={estimate}
          form={form}
          isSubmitting={isSubmitting}
          minimumServiceDate={minimumServiceDate}
          onSubmit={handleSubmit}
          regions={serviceRegions}
          submitError={submitError}
          updateForm={updateForm}
        />
      </div>

      <div className="relative mx-auto hidden max-w-7xl gap-4 px-4 sm:gap-5 sm:px-6 md:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:px-8">
        <Card className="animate-fade-up overflow-hidden rounded-xl bg-card/84 shadow-xl shadow-blue-100/55 dark:bg-slate-900/80 dark:shadow-blue-950/25">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5 dark:border-white/10">
              <h2 className="text-lg font-semibold tracking-[-0.035em] text-slate-950 sm:text-xl dark:text-white">
                {copy.formTitle}
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6 dark:text-slate-300">
                {copy.formDescription}
              </p>
            </div>

            <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
              <FormField
                htmlFor="serviceArea"
                label={copy.serviceArea}
                required
              >
                <Select
                  name="serviceArea"
                  onValueChange={(value) => updateForm("serviceArea", value)}
                  required
                  value={form.serviceArea}
                >
                  <SelectTrigger
                    className="h-9 rounded-md px-3"
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
                    className="h-9 rounded-md px-3"
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

              <FormField htmlFor="bedrooms" label={copy.bedrooms} required>
                <Input
                  className="h-9 rounded-md"
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
                  className="h-9 rounded-md"
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

              <FormField
                htmlFor="preferredDate"
                label={copy.preferredDate}
                required
              >
                <Input
                  className="h-9 rounded-md"
                  id="preferredDate"
                  name="preferredDate"
                  min={minimumServiceDate}
                  onChange={(event) =>
                    updateForm("preferredDate", event.target.value)
                  }
                  required
                  type="date"
                  value={form.preferredDate}
                />
              </FormField>

              <FormField
                className="sm:col-span-2"
                htmlFor="serviceAddress"
                label={copy.serviceAddress}
                required
              >
                <Input
                  className="h-9 rounded-md"
                  id="serviceAddress"
                  name="serviceAddress"
                  onChange={(event) =>
                    updateForm("serviceAddress", event.target.value)
                  }
                  placeholder={copy.serviceAddress}
                  required
                  value={form.serviceAddress}
                />
              </FormField>

              <PriceEstimatePanel
                copy={copy}
                estimate={estimate}
                hasInputs={Boolean(
                  form.serviceType && form.bedrooms && form.bathrooms
                )}
              />

              <FormField htmlFor="fullName" label={copy.fullName}>
                <Input
                  className="h-9 rounded-md"
                  id="fullName"
                  name="fullName"
                  onChange={(event) =>
                    updateForm("fullName", event.target.value)
                  }
                  placeholder={copy.fullName}
                  value={form.fullName}
                />
              </FormField>

              <FormField htmlFor="contact" label={copy.contact} required>
                <Input
                  className="h-9 rounded-md"
                  id="contact"
                  name="contact"
                  onChange={(event) =>
                    updateForm("contact", event.target.value)
                  }
                  placeholder={copy.contact}
                  required
                  value={form.contact}
                />
              </FormField>

              <FormField
                className="sm:col-span-2"
                htmlFor="notes"
                label={copy.details}
              >
                <Textarea
                  className="min-h-20 rounded-md"
                  id="notes"
                  name="notes"
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder={copy.details}
                  value={form.notes}
                />
              </FormField>
            </div>

            <div className="space-y-3 border-t border-border px-4 py-4 sm:px-6 dark:border-white/10">
              {submitError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">
                  {submitError}
                </div>
              ) : null}
              <div className="border-gray-150 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center">
                <Button
                  className="flex h-9 w-full shrink-0 items-center justify-center gap-2 px-4 text-xs font-semibold sm:w-auto"
                  disabled={isSubmitting}
                  type="submit"
                  variant="brand"
                >
                  <span>{isSubmitting ? copy.submitting : copy.submit}</span>
                  <PaperPlaneTiltIcon weight="fill" className="h-3.5 w-3.5" />
                </Button>
                <p className="max-w-md text-xs leading-5 text-slate-500 sm:max-w-xl dark:text-slate-400">
                  {copy.legalNotice}{" "}
                  <Link
                    className="font-semibold text-blue-700 underline underline-offset-2 transition-colors hover:text-blue-600 dark:text-blue-300"
                    to="/privacy"
                  >
                    {copy.privacy}
                  </Link>{" "}
                  /{" "}
                  <Link
                    className="font-semibold text-blue-700 underline underline-offset-2 transition-colors hover:text-blue-600 dark:text-blue-300"
                    to="/terms"
                  >
                    {copy.terms}
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </Card>

        <aside className="animate-fade-up self-start">
          <Card className="sticky top-24 rounded-xl bg-card/84 p-4 text-slate-950 shadow-lg shadow-blue-100/40 sm:p-5 sm:shadow-xl sm:shadow-blue-100/50 dark:bg-slate-900/80 dark:text-white dark:shadow-blue-950/25">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg text-blue-600 dark:shadow-none">
                <ChatCircleText size={20} weight="fill" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{copy.phoneTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {copy.phoneText}
                </p>
              </div>
            </div>
            <div className="mx-auto mt-4 w-36 rounded-xl border border-border bg-white/75 p-2 sm:w-40 dark:border-white/10 dark:bg-white/[0.06]">
              <img
                alt={language === "zh" ? "联系二维码" : "Contact QR code"}
                className="aspect-square w-full rounded-lg bg-white object-contain p-2"
                src={contactQrImage}
              />
            </div>
            <Button asChild className="mt-4 h-10 w-full" variant="brand">
              <a href={`tel:${contactPhone.replace(/\s+/g, "")}`}>
                <PhoneCall weight="fill" />
                {contactPhone}
              </a>
            </Button>
            <a
              className="mt-2 block truncate text-center text-sm font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          </Card>
        </aside>
      </div>
    </section>
  )
}

type MobileBookingFlowProps = {
  copy: BookingCopy
  estimate: PriceEstimate | null
  form: BookingFormState
  isSubmitting: boolean
  minimumServiceDate: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  regions: ReturnType<typeof regionsWithDerivedCities>
  submitError: string
  updateForm: <TField extends keyof BookingFormState>(
    field: TField,
    value: BookingFormState[TField]
  ) => void
}

function MobileBookingFlow({
  copy,
  estimate,
  form,
  isSubmitting,
  minimumServiceDate,
  onSubmit,
  regions,
  submitError,
  updateForm,
}: MobileBookingFlowProps) {
  const { cityName, language, regionName } = useI18n()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [stepError, setStepError] = useState("")
  const stepLabels =
    language === "zh"
      ? [copy.serviceType, "房屋信息", "联系确认"]
      : [copy.serviceType, "Home details", "Contact"]
  const hasHomeDetails = Boolean(
    form.bedrooms &&
    form.bathrooms &&
    form.preferredDate &&
    form.serviceAddress.trim()
  )

  function nextStep() {
    const isServiceStepComplete = Boolean(form.serviceArea && form.serviceType)

    if (step === 1 && !isServiceStepComplete) {
      setStepError(
        language === "zh"
          ? "请先选择服务区域和清洁需求。"
          : "Select a service area and cleaning need first."
      )
      return
    }

    if (
      step === 2 &&
      (!hasHomeDetails ||
        !isAvailableServiceDate(form.preferredDate, minimumServiceDate))
    ) {
      setStepError(
        language === "zh"
          ? "请补充户型和详细地址，并选择今天或之后的日期。"
          : "Add your home details and select today or a future date."
      )
      return
    }

    setStepError("")
    setStep((current) => (current === 3 ? current : ((current + 1) as 2 | 3)))
  }

  function previousStep() {
    setStepError("")
    setStep((current) => (current === 1 ? current : ((current - 1) as 1 | 2)))
  }

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    if (!form.contact.trim()) {
      event.preventDefault()
      setStepError(
        language === "zh"
          ? "请留下至少一种联系方式。"
          : "Please leave at least one contact method."
      )
      return
    }

    onSubmit(event)
  }

  return (
    <form
      className="mx-auto max-w-lg min-w-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
      onSubmit={submitBooking}
    >
      <div className="border-b border-border bg-card/92 px-4 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/92">
        <div className="text-xs font-semibold tracking-[0.12em] text-blue-700 uppercase dark:text-blue-200">
          {copy.kicker}
        </div>
        <h1 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
          {copy.heroTitle}
        </h1>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {copy.heroDescription}
        </p>
      </div>

      <div className="grid grid-cols-3 border-b border-border bg-card/72 px-4 py-3 dark:border-white/10 dark:bg-slate-900/72">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1
          const isCurrent = step === stepNumber
          const isComplete = step > stepNumber

          return (
            <div className="flex min-w-0 items-center gap-2" key={label}>
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete || isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? "✓" : stepNumber}
              </span>
              <span
                className={`truncate text-[11px] font-medium ${
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="min-w-0 space-y-4 px-4 py-5">
        {step === 1 ? (
          <>
            <MobileBookingSection
              description={
                language === "zh"
                  ? "选择服务区域和需要的清洁类型。"
                  : "Choose the service area and cleaning type."
              }
              title={language === "zh" ? "选择服务" : "Your service"}
            >
              <FormField
                htmlFor="mobile-service-area"
                label={copy.serviceArea}
                required
              >
                <Select
                  name="serviceArea"
                  onValueChange={(value) => updateForm("serviceArea", value)}
                  value={form.serviceArea}
                >
                  <SelectTrigger
                    className="h-11 rounded-lg text-sm"
                    id="mobile-service-area"
                  >
                    <SelectValue placeholder={copy.serviceArea} />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
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

              <div className="mt-5">
                <div className="text-xs font-medium text-foreground">
                  {copy.serviceType}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {copy.serviceTypes.map((service) => {
                    const isSelected = form.serviceType === service
                    return (
                      <button
                        className={`min-h-12 rounded-lg border px-3 text-left text-[13px] font-medium transition ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        }`}
                        key={service}
                        onClick={() => updateForm("serviceType", service)}
                        type="button"
                      >
                        {service}
                      </button>
                    )
                  })}
                </div>
              </div>
            </MobileBookingSection>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <MobileBookingSection
              description={
                language === "zh"
                  ? "填写房屋信息，客服会据此确认服务细节和费用。"
                  : "Add your home details so support can confirm the service and price."
              }
              title={language === "zh" ? "房屋信息" : "Home details"}
            >
              <div className="grid grid-cols-2 gap-3">
                <CountStepper
                  label={copy.bedrooms}
                  max={8}
                  min={1}
                  onChange={(value) => updateForm("bedrooms", value)}
                  step={1}
                  value={form.bedrooms}
                />
                <CountStepper
                  label={copy.bathrooms}
                  max={8}
                  min={1}
                  onChange={(value) => updateForm("bathrooms", value)}
                  step={0.5}
                  value={form.bathrooms}
                />
              </div>
              <FormField
                className="mt-4 max-w-full min-w-0 overflow-hidden"
                htmlFor="mobile-preferred-date"
                label={copy.preferredDate}
                required
              >
                <Input
                  className="h-11 max-w-full min-w-0 appearance-none rounded-lg text-sm [inline-size:100%]"
                  id="mobile-preferred-date"
                  min={minimumServiceDate}
                  name="preferredDate"
                  onChange={(event) =>
                    updateForm("preferredDate", event.target.value)
                  }
                  type="date"
                  value={form.preferredDate}
                />
              </FormField>
              <FormField
                className="mt-4"
                htmlFor="mobile-service-address"
                label={copy.serviceAddress}
                required
              >
                <Input
                  className="h-11 rounded-lg text-sm"
                  id="mobile-service-address"
                  onChange={(event) =>
                    updateForm("serviceAddress", event.target.value)
                  }
                  placeholder={copy.serviceAddress}
                  value={form.serviceAddress}
                />
              </FormField>
            </MobileBookingSection>
            <PriceEstimatePanel
              copy={copy}
              estimate={estimate}
              hasInputs={Boolean(
                form.serviceType && form.bedrooms && form.bathrooms
              )}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <MobileBookingSection
              description={
                language === "zh"
                  ? "留下联系方式，客服会与您确认服务安排。"
                  : "Leave your details and support will confirm the booking."
              }
              title={language === "zh" ? "联系信息" : "Contact details"}
            >
              <div className="space-y-4">
                <FormField htmlFor="mobile-full-name" label={copy.fullName}>
                  <Input
                    className="h-11 rounded-lg text-sm"
                    id="mobile-full-name"
                    onChange={(event) =>
                      updateForm("fullName", event.target.value)
                    }
                    placeholder={copy.fullName}
                    value={form.fullName}
                  />
                </FormField>
                <FormField
                  htmlFor="mobile-contact"
                  label={copy.contact}
                  required
                >
                  <Input
                    className="h-11 rounded-lg text-sm"
                    id="mobile-contact"
                    onChange={(event) =>
                      updateForm("contact", event.target.value)
                    }
                    placeholder={copy.contact}
                    value={form.contact}
                  />
                </FormField>
                <FormField htmlFor="mobile-notes" label={copy.details}>
                  <Textarea
                    className="min-h-24 rounded-lg text-sm"
                    id="mobile-notes"
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    placeholder={copy.details}
                    value={form.notes}
                  />
                </FormField>
              </div>
            </MobileBookingSection>
            <PriceEstimatePanel
              copy={copy}
              estimate={estimate}
              hasInputs={Boolean(
                form.serviceType && form.bedrooms && form.bathrooms
              )}
            />
            {submitError ? (
              <MobileMessage tone="red">{submitError}</MobileMessage>
            ) : null}
            <p className="px-1 text-xs leading-5 text-muted-foreground">
              {copy.legalNotice}{" "}
              <Link className="font-semibold text-primary" to="/privacy">
                {copy.privacy}
              </Link>{" "}
              /{" "}
              <Link className="font-semibold text-primary" to="/terms">
                {copy.terms}
              </Link>
            </p>
          </>
        ) : null}

        {stepError ? (
          <MobileMessage tone="red">{stepError}</MobileMessage>
        ) : null}
      </div>

      <div className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] border-y border-border bg-card/96 px-4 py-3 shadow-[0_-10px_24px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/96">
        <div className="flex gap-2">
          {step > 1 ? (
            <Button
              className="size-11 shrink-0 rounded-lg"
              onClick={previousStep}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">
                {language === "zh" ? "返回上一步" : "Previous step"}
              </span>
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              className="h-11 flex-1 rounded-lg"
              onClick={nextStep}
              type="button"
              variant="brand"
            >
              {language === "zh" ? "下一步" : "Continue"}
              <PaperPlaneTiltIcon size={16} weight="fill" />
            </Button>
          ) : (
            <Button
              className="h-11 flex-1 rounded-lg"
              disabled={isSubmitting}
              type="submit"
              variant="brand"
            >
              {isSubmitting ? copy.submitting : copy.submit}
              <PaperPlaneTiltIcon size={16} weight="fill" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

function MobileBookingSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <Card className="max-w-full min-w-0 rounded-xl border-border/80 bg-card/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/88 [&_[data-slot=label]]:text-xs">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
        {description}
      </p>
      <div className="mt-4 min-w-0">{children}</div>
    </Card>
  )
}

function CountStepper({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string
  max: number
  min: number
  onChange: (value: string) => void
  step: number
  value: string
}) {
  const numberValue = Number(value) || 0
  const setValue = (nextValue: number) =>
    onChange(String(Math.min(max, Math.max(min, nextValue))))

  return (
    <div className="rounded-lg border border-border bg-card p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button
          aria-label={`减少${label}`}
          className="size-9 rounded-md"
          disabled={numberValue <= min}
          onClick={() => setValue(numberValue - step)}
          size="icon"
          type="button"
          variant="outline"
        >
          <Minus className="size-4" />
        </Button>
        <output className="min-w-8 text-center text-base font-semibold text-foreground">
          {numberValue || "-"}
        </output>
        <Button
          aria-label={`增加${label}`}
          className="size-9 rounded-md"
          disabled={numberValue >= max}
          onClick={() => setValue(numberValue + step)}
          size="icon"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function MobileMessage({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: "amber" | "blue" | "red"
}) {
  const toneClass = {
    amber:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100",
    blue: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100",
  }[tone]

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm leading-6 ${toneClass}`}
    >
      {children}
    </div>
  )
}

function PriceEstimatePanel({
  copy,
  estimate,
  hasInputs,
}: {
  copy: BookingCopy
  estimate: PriceEstimate | null
  hasInputs: boolean
}) {
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
              {copy.estimateTitle}
            </div>
            <div className="mt-0.5 text-lg font-bold text-blue-700 dark:text-blue-200">
              {estimate.price}
            </div>
          </div>
          <div className="text-xs leading-5 text-slate-600 dark:text-slate-300">
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

  return tier
    ? { label: tier.label, price: tier.price, time: tier.time[language] }
    : null
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

function getLocalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function isAvailableServiceDate(value: string, minimumDate: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= minimumDate
}

function BookingSuccessPage({
  contactEmail,
  contactPhone,
  copy,
  language,
  order,
  qrImage,
}: {
  contactEmail: string
  contactPhone: string
  copy: BookingCopy
  language: Language
  order: CmsPaymentOrder
  qrImage: string
}) {
  const isZh = language === "zh"
  const [isOrderIdCopied, setIsOrderIdCopied] = useState(false)

  async function copyOrderId() {
    try {
      await navigator.clipboard.writeText(order.orderId)
      setIsOrderIdCopied(true)
      toast.success(isZh ? "订单号已复制" : "Order number copied")
      window.setTimeout(() => setIsOrderIdCopied(false), 1800)
    } catch {
      toast.error(isZh ? "复制失败，请手动复制" : "Copy failed")
    }
  }

  return (
    <section className="relative overflow-hidden pt-[calc(60px+2rem)] pb-8 md:pt-[calc(72px+3rem)] md:pb-10">
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <Card className="animate-fade-up overflow-hidden shadow-xl shadow-blue-950/8">
          <div className="border-b border-border bg-blue-50/70 px-5 py-5 sm:px-7 sm:py-6 dark:bg-blue-500/10">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-blue-500">
                <PaperPlaneTiltIcon size={20} weight="fill" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {isZh ? "预约需求已提交" : "Booking request submitted"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {copy.success}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:p-7">
            <div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
                <div className="text-xs text-muted-foreground">
                  {isZh ? "预约订单号" : "Booking order number"}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="min-w-0 flex-1 font-mono text-lg font-semibold break-all text-foreground">
                    {order.orderId}
                  </div>
                  <Button
                    aria-label={isZh ? "复制订单号" : "Copy order number"}
                    className="size-9 shrink-0"
                    onClick={copyOrderId}
                    size="icon"
                    title={isZh ? "复制订单号" : "Copy order number"}
                    type="button"
                    variant="outline"
                  >
                    {isOrderIdCopied ? (
                      <Check size={17} weight="bold" />
                    ) : (
                      <ClipboardText size={17} weight="bold" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {isZh
                  ? "请扫码添加企业微信客服，并发送上方订单号。客服会为您分配阿姨，并确认服务细节与最终费用。"
                  : "Scan to add our WeCom support and send the order number above. Support will assign an auntie and confirm the service details and final price."}
              </p>
              <div className="mt-4 grid gap-2 text-sm">
                <a
                  className="flex w-fit items-center gap-2 rounded-md px-1 py-1 font-medium text-blue-700 transition-colors hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
                  href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}
                >
                  <PhoneCall className="shrink-0" size={17} weight="fill" />
                  <span>{contactPhone}</span>
                </a>
                <a
                  className="flex w-fit min-w-0 items-center gap-2 rounded-md px-1 py-1 font-medium text-blue-700 transition-colors hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
                  href={`mailto:${contactEmail}`}
                >
                  <EnvelopeSimple
                    className="shrink-0"
                    size={17}
                    weight="bold"
                  />
                  <span className="break-all">{contactEmail}</span>
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-52 rounded-xl border border-border bg-white p-2 shadow-sm dark:border-white/10">
              <img
                alt={isZh ? "企业微信客服二维码" : "WeCom support QR code"}
                className="aspect-square w-full rounded-lg object-contain"
                src={qrImage}
              />
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

export { BookingPage }
