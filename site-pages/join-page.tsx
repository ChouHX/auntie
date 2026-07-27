import { type FormEvent, useState } from "react"
import {
  CheckCircle,
  EnvelopeSimple,
  PaperPlaneTilt,
  PhoneCall,
} from "@phosphor-icons/react"

import { PageHero } from "@/components/common/page-hero"
import { Section } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCmsContent } from "@/hooks/use-cms-content"
import { submitPublicForm } from "@/lib/cms-api"
import { useI18n } from "@/lib/i18n"

type AuntieApplicationState = {
  availability: string
  city: string
  contact: string
  experience: string
  name: string
  notes: string
  serviceArea: string
  serviceTypes: string[]
  tools: string
}

const initialApplicationState: AuntieApplicationState = {
  availability: "",
  city: "",
  contact: "",
  experience: "",
  name: "",
  notes: "",
  serviceArea: "",
  serviceTypes: [],
  tools: "",
}

const serviceTypeValues = [
  "regular",
  "deep",
  "postRenovation",
  "moveOut",
  "commercial",
  "recurring",
]

function JoinPage() {
  const { dict, language } = useI18n()
  const { content } = useCmsContent(["contactPage"])
  const join = dict.joinPage
  const contactSettings =
    content.contactPage?.[language] ?? content.contactPage?.zh
  const contactEmail =
    contactSettings?.contactEmail || "auntiechenhome@gmail.com"
  const contactPhone = contactSettings?.contactPhone || "+1 9492798310"
  const contactQrImage = contactSettings?.qrImage || "/wechat_qrcode.jpg"
  const contactPhoneHref = contactPhone.replace(/[^\d+]/g, "")
  const phoneLabel =
    language === "zh" ? `电话：${contactPhone}` : `Phone: ${contactPhone}`
  const emailLabel =
    language === "zh" ? `邮箱：${contactEmail}` : `Email: ${contactEmail}`
  const [form, setForm] = useState<AuntieApplicationState>(
    initialApplicationState
  )
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  function updateForm<TField extends keyof AuntieApplicationState>(
    field: TField,
    value: AuntieApplicationState[TField]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setIsSubmitted(false)
    setSubmitError("")
  }

  function setServiceType(serviceType: string, checked: boolean) {
    updateForm(
      "serviceTypes",
      checked
        ? Array.from(new Set([...form.serviceTypes, serviceType]))
        : form.serviceTypes.filter((item) => item !== serviceType)
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      await submitPublicForm("join", {
        姓名: form.name,
        联系方式: form.contact,
        城市: form.city,
        服务区域: form.serviceArea,
        经验: form.experience,
        可接单时间: form.availability,
        工具情况: form.tools,
        可做服务: form.serviceTypes
          .map((serviceType) => {
            const index = serviceTypeValues.indexOf(serviceType)
            return join.serviceTypeOptions[index] ?? serviceType
          })
          .join(", "),
        备注: form.notes,
      })
      setIsSubmitted(true)
      setForm(initialApplicationState)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : join.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        kicker={join.kicker}
        title={join.heroTitle}
        description={join.heroDescription}
      />
      <Section className="py-6 sm:py-12">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <Card className="overflow-hidden rounded-xl bg-card/84 shadow-xl shadow-blue-100/55 dark:bg-slate-900/80 dark:shadow-blue-950/25">
            <form onSubmit={handleSubmit}>
              <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5 dark:border-white/10">
                <h2 className="text-lg font-semibold tracking-[-0.035em] text-slate-950 sm:text-xl dark:text-white">
                  {join.formTitle}
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6 dark:text-slate-300">
                  {join.formDescription}
                </p>
              </div>

              <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
                <FormField htmlFor="name" label={join.name} required>
                  <Input
                    className="h-9 rounded-md"
                    id="name"
                    name="name"
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder={join.name}
                    required
                    value={form.name}
                  />
                </FormField>

                <FormField htmlFor="contact" label={join.contact} required>
                  <Input
                    className="h-9 rounded-md"
                    id="contact"
                    name="contact"
                    onChange={(event) =>
                      updateForm("contact", event.target.value)
                    }
                    placeholder={join.contact}
                    required
                    value={form.contact}
                  />
                </FormField>

                <FormField htmlFor="city" label={join.city} required>
                  <Input
                    className="h-9 rounded-md"
                    id="city"
                    name="city"
                    onChange={(event) => updateForm("city", event.target.value)}
                    placeholder={join.city}
                    required
                    value={form.city}
                  />
                </FormField>

                <FormField htmlFor="serviceArea" label={join.serviceArea}>
                  <Input
                    className="h-9 rounded-md"
                    id="serviceArea"
                    name="serviceArea"
                    onChange={(event) =>
                      updateForm("serviceArea", event.target.value)
                    }
                    placeholder={join.serviceArea}
                    value={form.serviceArea}
                  />
                </FormField>

                <FormField
                  htmlFor="experience"
                  label={join.experience}
                  required
                >
                  <Input
                    className="h-9 rounded-md"
                    id="experience"
                    name="experience"
                    onChange={(event) =>
                      updateForm("experience", event.target.value)
                    }
                    placeholder={join.experience}
                    required
                    value={form.experience}
                  />
                </FormField>

                <FormField
                  htmlFor="availability"
                  label={join.availability}
                  required
                >
                  <Input
                    className="h-9 rounded-md"
                    id="availability"
                    name="availability"
                    onChange={(event) =>
                      updateForm("availability", event.target.value)
                    }
                    placeholder={join.availabilityPlaceholder}
                    required
                    value={form.availability}
                  />
                </FormField>

                <FormField htmlFor="tools" label={join.tools}>
                  <Input
                    className="h-9 rounded-md"
                    id="tools"
                    name="tools"
                    onChange={(event) =>
                      updateForm("tools", event.target.value)
                    }
                    placeholder={join.tools}
                    value={form.tools}
                  />
                </FormField>

                <FormField className="sm:col-span-2" label={join.serviceTypes}>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {join.serviceTypeOptions.map((serviceType, index) => {
                      const serviceTypeValue = serviceTypeValues[index]

                      return (
                        <label
                          key={serviceType}
                          className="flex items-center gap-2 rounded-lg border border-border bg-blue-50/50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
                        >
                          <Checkbox
                            checked={form.serviceTypes.includes(
                              serviceTypeValue
                            )}
                            onCheckedChange={(checked) =>
                              setServiceType(serviceTypeValue, checked === true)
                            }
                          />
                          {serviceType}
                        </label>
                      )
                    })}
                  </div>
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  htmlFor="notes"
                  label={join.notes}
                >
                  <Textarea
                    className="min-h-20 rounded-md"
                    id="notes"
                    name="notes"
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    placeholder={join.notesPlaceholder}
                    value={form.notes}
                  />
                </FormField>
              </div>

              <div className="space-y-3 border-t border-border px-4 py-4 sm:px-6 dark:border-white/10">
                {isSubmitted ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
                    {join.success}
                  </div>
                ) : null}
                {submitError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">
                    {submitError}
                  </div>
                ) : null}
                <Button
                  className="h-10 w-full"
                  disabled={isSubmitting}
                  type="submit"
                  variant="brand"
                >
                  {isSubmitting
                    ? join.submitting
                    : isSubmitted
                      ? join.submitted
                      : join.submit}
                  <PaperPlaneTilt weight="fill" />
                </Button>
              </div>
            </form>
          </Card>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card className="rounded-xl bg-card/84 p-4 shadow-lg shadow-blue-100/40 sm:p-5 sm:shadow-xl sm:shadow-blue-100/50 dark:bg-slate-900/80 dark:shadow-blue-950/25">
              <h3 className="text-lg font-semibold tracking-[-0.03em]">
                {join.contactCardTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {join.contactCardText}
              </p>
              <img
                src={contactQrImage}
                alt="微信二维码"
                className="mx-auto mt-4 aspect-square w-36 rounded-xl bg-white object-cover p-2 shadow-sm ring-1 ring-blue-100 sm:w-44 dark:ring-white/10"
                loading="lazy"
              />
              <div className="mt-4 space-y-2 text-sm">
                <a
                  className="flex items-center gap-2 text-slate-700 transition hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-200"
                  href={`tel:${contactPhoneHref}`}
                >
                  <PhoneCall size={17} weight="fill" />
                  {phoneLabel}
                </a>
                <a
                  className="flex items-center gap-2 text-slate-700 transition hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-200"
                  href={`mailto:${contactEmail}`}
                >
                  <EnvelopeSimple size={17} weight="bold" />
                  {emailLabel}
                </a>
              </div>
            </Card>

            <Card className="rounded-xl bg-card/84 p-4 shadow-lg shadow-blue-100/40 sm:p-5 sm:shadow-xl sm:shadow-blue-100/50 dark:bg-slate-900/80 dark:shadow-blue-950/25">
              <h3 className="text-lg font-semibold tracking-[-0.03em]">
                {join.sideTitle}
              </h3>
              <div className="mt-4 space-y-2">
                {join.highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-lg border border-border bg-blue-50/60 px-3 py-2 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
                  >
                    <CheckCircle
                      className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
                      size={17}
                      weight="fill"
                    />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-4 dark:border-white/10">
                <h3 className="text-base font-semibold tracking-[-0.02em]">
                  {join.closingTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {join.closingText}
                </p>
              </div>
            </Card>
          </aside>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CompactJoinCard title={join.fitTitle} items={join.fitItems} />
          <CompactJoinCard title={join.benefitsTitle} items={join.benefits} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <CompactStringCard
            title={join.notFitTitle}
            items={join.notFitItems}
          />
          <CompactStringCard
            ordered
            title={join.growthTitle}
            items={join.growthSteps}
          />
        </div>

        <Card className="mt-4 rounded-xl bg-white/60 p-4 shadow-lg shadow-blue-100/35 sm:p-5 dark:bg-white/[0.06] dark:shadow-none">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl dark:text-white">
            {join.principlesTitle}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {join.principles.map((item) => (
              <div key={item.title}>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </>
  )
}

function CompactJoinCard({
  items,
  title,
}: {
  items: ReadonlyArray<{ text: string; title: string }>
  title: string
}) {
  return (
    <Card className="rounded-xl bg-card/84 p-4 shadow-lg shadow-blue-100/45 sm:p-5 dark:bg-slate-900/80 dark:shadow-blue-950/25">
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl dark:text-white">
        {title}
      </h2>
      <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
        {items.map((item) => (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-border bg-blue-50/50 px-3 py-2.5 sm:gap-3 sm:py-3 dark:border-white/10 dark:bg-white/[0.06]"
            key={item.title}
          >
            <CheckCircle
              className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
              size={17}
              weight="fill"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function CompactStringCard({
  items,
  ordered,
  title,
}: {
  items: ReadonlyArray<string>
  ordered?: boolean
  title: string
}) {
  return (
    <Card className="rounded-xl bg-card/84 p-4 shadow-lg shadow-blue-100/45 sm:p-5 dark:bg-slate-900/80 dark:shadow-blue-950/25">
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl dark:text-white">
        {title}
      </h2>
      <div className="mt-3 grid gap-2 sm:mt-4">
        {items.map((item, index) => (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-border bg-white/60 px-3 py-2 text-sm leading-6 text-slate-700 sm:gap-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
            key={item}
          >
            {ordered ? (
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {index + 1}
              </span>
            ) : (
              <CheckCircle
                className="mt-1 shrink-0 text-blue-700 dark:text-blue-300"
                size={16}
                weight="fill"
              />
            )}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export { JoinPage }
