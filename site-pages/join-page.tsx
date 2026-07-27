import { type FormEvent, useState } from "react"
import { PaperPlaneTilt } from "@phosphor-icons/react"

import { PageHero } from "@/components/common/page-hero"
import { Section } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  const { dict } = useI18n()
  const join = dict.joinPage
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
      <Section className="px-4 py-8 sm:px-6 sm:py-12 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden rounded-2xl border border-border bg-card/90 p-1 shadow-xl shadow-blue-100/55 dark:bg-slate-900/80 dark:shadow-blue-950/25">
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

                <FormField htmlFor="experience" label={join.experience} required>
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
                    placeholder={join.availability}
                    required
                    value={form.availability}
                  />
                </FormField>

                <FormField htmlFor="tools" label={join.tools}>
                  <Input
                    className="h-9 rounded-md"
                    id="tools"
                    name="tools"
                    onChange={(event) => updateForm("tools", event.target.value)}
                    placeholder={join.tools}
                    value={form.tools}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {join.serviceTypes}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {serviceTypeValues.map((serviceType, index) => {
                      const label =
                        join.serviceTypeOptions[index] ?? serviceType
                      const checked = form.serviceTypes.includes(serviceType)

                      return (
                        <label
                          className="flex items-center gap-2 rounded-lg border border-border bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                          key={serviceType}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setServiceType(serviceType, value === true)
                            }
                          />
                          <span>{label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <FormField htmlFor="notes" label={join.notes}>
                    <Textarea
                      className="min-h-24 rounded-md"
                      id="notes"
                      name="notes"
                      onChange={(event) =>
                        updateForm("notes", event.target.value)
                      }
                      placeholder={join.notes}
                      value={form.notes}
                    />
                  </FormField>
                </div>
              </div>

              <div className="border-t border-border px-4 py-4 sm:px-6 dark:border-white/10">
                {isSubmitted ? (
                  <p className="mb-3 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                    {join.success}
                  </p>
                ) : null}
                {submitError ? (
                  <p className="mb-3 text-sm leading-6 text-red-600 dark:text-red-300">
                    {submitError}
                  </p>
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
        </div>
      </Section>
    </>
  )
}

export { JoinPage }
