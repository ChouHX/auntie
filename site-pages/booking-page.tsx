import { type FormEvent, useMemo, useState } from "react"
import {
  ChatCircleText,
  Check,
  ClipboardText,
  EnvelopeSimple,
  PhoneCall,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react"
import { ChevronLeft, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { Link } from "@/lib/router-compat"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { defaultCmsContent, defaultContactPage } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { regionsWithDerivedCities } from "@/lib/service-regions"
import { createBookingOrder } from "@/lib/cms-api"
import {
  calculateBookingEstimate,
  formatBookingRequest,
  getBookingConfigForArea,
  isValidBookingPhone,
} from "@/lib/booking-config"
import { useI18n, type Language } from "@/lib/i18n"
import type {
  CmsBookingCatalogItem,
  CmsBookingLocationConfig,
  CmsPaymentOrder,
} from "@/types/cms"

type BookingFormState = {
  addOnIds: string[]
  addOnOther: string
  bathrooms: string
  bedrooms: string
  contact: string
  fullName: string
  hasPets: boolean
  notes: string
  preferredDate: string
  serviceAddress: string
  serviceArea: string
  serviceType: string
  studio: boolean
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

const bookingCopy: Record<Language, BookingCopy> = {
  zh: {
    bathrooms: "卫生间数量",
    bedrooms: "卧室数量",
    contact: "联系电话",
    details: "备注",
    estimateCustom: "该服务需要客服进一步确认参考价格",
    estimateEmpty: "选择服务类型后显示每小时参考单价。",
    estimateNote:
      "仅供预估参考，不会写入预约订单。最终费用由客服根据城市、房屋状态和服务细节确认。",
    estimateTitle: "参考价格",
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
    submitted: "预约信息已生成",
    submitting: "发送中...",
    success:
      "请点击下方按钮复制完整预约信息，并返回企业微信发送给客服。客服收到信息后，会为您确认服务安排。",
    terms: "服务条款",
    phoneTitle: "需要更快沟通？",
    phoneText: "可先电话或企业微信联系，表单信息后续可同步给客服。",
  },
  en: {
    bathrooms: "Bathrooms",
    bedrooms: "Bedrooms",
    contact: "Local phone number",
    details: "Notes",
    estimateCustom: "Contact support for a reference price for this request",
    estimateEmpty: "Select a service type to see the hourly reference rate.",
    estimateNote:
      "For reference only and not saved as the booking amount. Support will confirm the final price based on location, home condition, and service details.",
    estimateTitle: "Reference price",
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
      "Copy the complete booking information below and send it to support in WeCom. Support will confirm the service arrangement.",
    terms: "Terms of Service",
    phoneTitle: "Need faster help?",
    phoneText:
      "You can contact us by phone or WeCom first, then share the form details with support.",
  },
}

const initialFormState: BookingFormState = {
  addOnIds: [],
  addOnOther: "",
  bathrooms: "",
  bedrooms: "",
  contact: "",
  fullName: "",
  hasPets: false,
  notes: "",
  preferredDate: "",
  serviceAddress: "",
  serviceArea: "",
  serviceType: "",
  studio: false,
}

function BookingPage() {
  return <BookingRequestSection />
}

function BookingRequestSection() {
  const { cityName, language, regionName } = useI18n()
  const { content } = useCmsContent([
    "bookingConfigs",
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
  const bookingConfig = useMemo(
    () =>
      getBookingConfigForArea(
        content.bookingConfigs ?? defaultCmsContent.bookingConfigs,
        content.serviceLocations ?? defaultCmsContent.serviceLocations,
        form.serviceArea
      ),
    [content.bookingConfigs, content.serviceLocations, form.serviceArea]
  )
  const selectedLocation = (content.serviceLocations ?? []).find(
    (item) => `${item.city} · ${item.country}` === form.serviceArea
  )
  const selectedCountryCode = (content.serviceRegions ?? []).find(
    (item) => item.name === selectedLocation?.country
  )?.code2
  const serviceItems = useMemo(
    () =>
      (bookingConfig?.items ?? []).filter(
        (item) => item.type === "service" && item.enabled
      ),
    [bookingConfig]
  )
  const addOnItems = useMemo(
    () =>
      (bookingConfig?.items ?? []).filter(
        (item) => item.type === "addon" && item.enabled
      ),
    [bookingConfig]
  )
  const selectedService = serviceItems.find(
    (item) => item.id === form.serviceType
  )
  const estimate = useMemo(
    () =>
      calculateBookingEstimate({
        addOnIds: form.addOnIds,
        bathrooms: Number(form.bathrooms),
        bedrooms: Number(form.bedrooms),
        config: bookingConfig,
        serviceTypeId: form.serviceType,
        studio: form.studio,
      }),
    [
      bookingConfig,
      form.addOnIds,
      form.bathrooms,
      form.bedrooms,
      form.serviceType,
      form.studio,
    ]
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
    if (!isValidBookingPhone(form.contact, selectedCountryCode)) {
      setSubmitError(
        language === "zh"
          ? "请填写可在服务地区接听的有效电话号码。"
          : "Enter a valid local phone number for the service area."
      )
      return
    }
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const result = await createBookingOrder({
        addOnIds: form.addOnIds,
        addOnOther: form.addOnOther,
        bathrooms: form.bathrooms,
        bedrooms: form.bedrooms,
        contact: form.contact,
        customerName: form.fullName,
        hasPets: form.hasPets,
        note: form.notes,
        serviceAddress: form.serviceAddress,
        serviceArea: form.serviceArea,
        serviceDate: form.preferredDate,
        serviceType: selectedService?.label ?? "",
        serviceTypeId: form.serviceType,
        studio: form.studio,
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
          addOnItems={addOnItems}
          bookingConfig={bookingConfig}
          copy={copy}
          estimate={estimate}
          form={form}
          isSubmitting={isSubmitting}
          minimumServiceDate={minimumServiceDate}
          onSubmit={handleSubmit}
          regions={serviceRegions}
          serviceItems={serviceItems}
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
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold text-primary">第一步</div>
                <h3 className="mt-0.5 text-sm font-semibold text-foreground">
                  选择服务
                </h3>
              </div>
              <FormField
                htmlFor="serviceArea"
                label={copy.serviceArea}
                required
              >
                <Select
                  name="serviceArea"
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      addOnIds: [],
                      addOnOther: "",
                      serviceArea: value,
                      serviceType: "",
                    }))
                  }
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
                    {serviceItems.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.label} ·{" "}
                        {service.quoteRequired
                          ? "客服确认"
                          : `${bookingConfig?.currency ?? "USD"} ${service.basePrice.toFixed(2)}/小时`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {selectedService?.description ? (
                <div className="rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs leading-5 text-slate-700 sm:col-span-2 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-slate-200">
                  {selectedService.description}
                </div>
              ) : null}

              <div className="mt-2 border-t border-border pt-3 sm:col-span-2">
                <div className="text-xs font-semibold text-primary">第二步</div>
                <h3 className="mt-0.5 text-sm font-semibold text-foreground">
                  填写房屋及预约信息
                </h3>
              </div>

              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm">
                  <Checkbox
                    checked={form.studio}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        bedrooms: checked === true ? "0" : "",
                        studio: checked === true,
                      }))
                    }
                  />
                  Studio（开间，无独立卧室）
                </label>

                <BookingAddOnSelector
                  addOnOther={form.addOnOther}
                  currency={bookingConfig?.currency ?? "USD"}
                  items={addOnItems}
                  onOtherChange={(value) => updateForm("addOnOther", value)}
                  onSelectedChange={(value) => updateForm("addOnIds", value)}
                  selectedIds={form.addOnIds}
                />
              </div>

              {!form.studio ? (
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
              ) : null}

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
                  step="1"
                  type="number"
                  value={form.bathrooms}
                />
              </FormField>

              <FormField label="宠物情况">
                <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm">
                  <Checkbox
                    checked={form.hasPets}
                    onCheckedChange={(checked) =>
                      updateForm("hasPets", checked === true)
                    }
                  />
                  是否有宠物
                </label>
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
                  form.serviceType &&
                  (form.studio || form.bedrooms) &&
                  form.bathrooms
                )}
                service={selectedService}
              />

              <FormField htmlFor="fullName" label={copy.fullName} required>
                <Input
                  className="h-9 rounded-md"
                  id="fullName"
                  name="fullName"
                  onChange={(event) =>
                    updateForm("fullName", event.target.value)
                  }
                  placeholder={copy.fullName}
                  required
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
                  type="tel"
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
  addOnItems: CmsBookingCatalogItem[]
  bookingConfig?: CmsBookingLocationConfig
  copy: BookingCopy
  estimate: ReturnType<typeof calculateBookingEstimate>
  form: BookingFormState
  isSubmitting: boolean
  minimumServiceDate: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  regions: ReturnType<typeof regionsWithDerivedCities>
  serviceItems: CmsBookingCatalogItem[]
  submitError: string
  updateForm: <TField extends keyof BookingFormState>(
    field: TField,
    value: BookingFormState[TField]
  ) => void
}

function MobileBookingFlow({
  addOnItems,
  bookingConfig,
  copy,
  estimate,
  form,
  isSubmitting,
  minimumServiceDate,
  onSubmit,
  regions,
  serviceItems,
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
    (form.studio || form.bedrooms) &&
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
    if (!form.fullName.trim() || !isValidBookingPhone(form.contact)) {
      event.preventDefault()
      setStepError(
        language === "zh"
          ? "请填写联系人和可在当地接听的有效电话号码。"
          : "Enter a contact name and a valid local phone number."
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
                  onValueChange={(value) => {
                    updateForm("serviceArea", value)
                    updateForm("serviceType", "")
                    updateForm("addOnIds", [])
                    updateForm("addOnOther", "")
                  }}
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
                  </SelectContent>
                </Select>
              </FormField>

              <div className="mt-5">
                <div className="text-xs font-medium text-foreground">
                  {copy.serviceType}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {serviceItems.map((service) => {
                    const isSelected = form.serviceType === service.id
                    return (
                      <button
                        className={`min-h-12 rounded-lg border px-3 text-left text-[13px] font-medium transition ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        }`}
                        key={service.id}
                        onClick={() => updateForm("serviceType", service.id)}
                        type="button"
                      >
                        <span className="block">{service.label}</span>
                        <span
                          className={`mt-0.5 block text-[10px] font-normal ${
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {service.quoteRequired
                            ? "客服确认"
                            : `${bookingConfig?.currency ?? "USD"} ${service.basePrice.toFixed(2)}/小时`}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {serviceItems.find((item) => item.id === form.serviceType)
                  ?.description ? (
                  <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs leading-5 text-slate-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-slate-200">
                    {
                      serviceItems.find((item) => item.id === form.serviceType)
                        ?.description
                    }
                  </p>
                ) : null}
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
              <div className="mb-3 grid grid-cols-2 gap-3">
                <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
                  <Checkbox
                    checked={form.studio}
                    onCheckedChange={(checked) => {
                      updateForm("studio", checked === true)
                      updateForm("bedrooms", checked === true ? "0" : "")
                    }}
                  />
                  Studio（开间）
                </label>
                <BookingAddOnSelector
                  addOnOther={form.addOnOther}
                  currency={bookingConfig?.currency ?? "USD"}
                  items={addOnItems}
                  onOtherChange={(value) => updateForm("addOnOther", value)}
                  onSelectedChange={(value) => updateForm("addOnIds", value)}
                  selectedIds={form.addOnIds}
                />
              </div>
              <div
                className={
                  form.studio
                    ? "grid grid-cols-1 gap-3"
                    : "grid grid-cols-2 gap-3"
                }
              >
                {!form.studio ? (
                  <CountStepper
                    label={copy.bedrooms}
                    max={8}
                    min={1}
                    onChange={(value) => updateForm("bedrooms", value)}
                    step={1}
                    value={form.bedrooms}
                  />
                ) : null}
                <CountStepper
                  label={copy.bathrooms}
                  max={8}
                  min={1}
                  onChange={(value) => updateForm("bathrooms", value)}
                  step={1}
                  value={form.bathrooms}
                />
              </div>
              <label className="mt-3 flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
                <Checkbox
                  checked={form.hasPets}
                  onCheckedChange={(checked) =>
                    updateForm("hasPets", checked === true)
                  }
                />
                是否有宠物
              </label>
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
                form.serviceType &&
                (form.studio || form.bedrooms) &&
                form.bathrooms
              )}
              service={serviceItems.find(
                (item) => item.id === form.serviceType
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
                <FormField
                  htmlFor="mobile-full-name"
                  label={copy.fullName}
                  required
                >
                  <Input
                    className="h-11 rounded-lg text-sm"
                    id="mobile-full-name"
                    onChange={(event) =>
                      updateForm("fullName", event.target.value)
                    }
                    placeholder={copy.fullName}
                    required
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
                    type="tel"
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
                form.serviceType &&
                (form.studio || form.bedrooms) &&
                form.bathrooms
              )}
              service={serviceItems.find(
                (item) => item.id === form.serviceType
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

function BookingAddOnSelector({
  addOnOther,
  currency,
  items,
  onOtherChange,
  onSelectedChange,
  selectedIds,
}: {
  addOnOther: string
  currency: string
  items: CmsBookingCatalogItem[]
  onOtherChange: (value: string) => void
  onSelectedChange: (value: string[]) => void
  selectedIds: string[]
}) {
  const selectedItems = items.filter((item) => selectedIds.includes(item.id))
  const hasOther = selectedItems.some(
    (item) => item.id.includes("other") || item.label.includes("其他")
  )

  function toggleItem(itemId: string, checked: boolean) {
    onSelectedChange(
      checked
        ? Array.from(new Set([...selectedIds, itemId]))
        : selectedIds.filter((id) => id !== itemId)
    )
  }

  return (
    <div className="min-w-0">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="h-9 w-full min-w-0 justify-between rounded-md px-3 text-left"
            title="附加项目（不包含在基础清洁服务内）"
            type="button"
            variant="outline"
          >
            <span className="min-w-0 truncate text-xs font-medium">
              附加项目
              <span className="font-normal text-muted-foreground">
                {selectedItems.length
                  ? ` · ${selectedItems.map((item) => item.label).join("、")}`
                  : " · 未选择"}
              </span>
            </span>
            <Plus className="size-4 shrink-0" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>选择附加项目</DialogTitle>
            <DialogDescription>
              支持多选，项目内容和参考价格由当前服务地区配置。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[52vh] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {items.map((item) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/40"
                key={item.id}
              >
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) =>
                    toggleItem(item.id, checked === true)
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3 text-sm font-medium">
                    <span>{item.label}</span>
                    <span className="shrink-0 font-mono text-xs text-primary">
                      {item.quoteRequired
                        ? "客服确认"
                        : `${currency} ${item.basePrice.toFixed(2)} / 次`}
                    </span>
                  </span>
                  {item.description ? (
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
            {!items.length ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                当前地区暂无可选附加项目
              </div>
            ) : null}
            {hasOther ? (
              <FormField label="其他附加项目说明">
                <Textarea
                  className="min-h-20"
                  onChange={(event) => onOtherChange(event.target.value)}
                  placeholder="请说明需要客服确认的其他项目"
                  value={addOnOther}
                />
              </FormField>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">确认选择</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PriceEstimatePanel({
  copy,
  estimate,
  hasInputs,
  service,
}: {
  copy: BookingCopy
  estimate: ReturnType<typeof calculateBookingEstimate>
  hasInputs: boolean
  service?: CmsBookingCatalogItem
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 sm:col-span-2 dark:border-blue-400/20 dark:bg-blue-500/10">
      <div className="text-sm font-semibold text-slate-950 dark:text-white">
        {copy.estimateTitle}
      </div>
      {estimate ? (
        <div className="mt-2.5 grid gap-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="font-semibold text-slate-950 dark:text-white">
              {service?.label}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              {service?.description || copy.estimateNote}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl font-bold text-blue-700 dark:text-blue-200">
              {estimate.amount !== null
                ? `${estimate.currency} ${estimate.amount.toFixed(2)}`
                : `${estimate.currency} ${estimate.hourlyRate.toFixed(2)} / 小时`}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {estimate.addOnAmount > 0
                ? `另含附加项目 ${estimate.currency} ${estimate.addOnAmount.toFixed(2)} / 次`
                : "附加项目按次收费"}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {service?.description ? (
            <p className="mb-1">{service.description}</p>
          ) : null}
          <p>{hasInputs ? copy.estimateCustom : copy.estimateEmpty}</p>
        </div>
      )}
      <p className="mt-2 border-t border-blue-200/70 pt-2 text-[11px] leading-5 text-slate-500 dark:border-blue-400/20 dark:text-slate-400">
        当前价格仅供参考，最终费用及服务安排由客服确认。
      </p>
    </div>
  )
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
  const [isBookingCopied, setIsBookingCopied] = useState(false)

  async function copyBookingInfo() {
    try {
      await navigator.clipboard.writeText(formatBookingRequest(order))
      setIsBookingCopied(true)
      toast.success(
        isZh
          ? "已复制，请返回企业微信粘贴并发送给客服。"
          : "Copied. Return to WeCom and send it to support."
      )
      window.setTimeout(() => setIsBookingCopied(false), 1800)
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
                  {isZh ? "预约信息已生成" : "Booking information ready"}
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
                </div>
              </div>
              <Button
                className="mt-4 h-11 w-full"
                onClick={copyBookingInfo}
                type="button"
                variant="brand"
              >
                {isBookingCopied ? (
                  <Check size={18} weight="bold" />
                ) : (
                  <ClipboardText size={18} weight="bold" />
                )}
                {isZh ? "一键复制预约信息" : "Copy booking information"}
              </Button>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {isZh
                  ? "请点击按钮复制完整预约信息，并返回企业微信发送给客服。客服收到信息后，会为您确认服务安排。"
                  : "Copy the complete booking information and send it to support in WeCom. Support will confirm the arrangement."}
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
