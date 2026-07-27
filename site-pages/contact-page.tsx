import { EnvelopeSimple, MapPin } from "@phosphor-icons/react"

import { PageHero } from "@/components/common/page-hero"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { defaultContactPage } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { companyIdentity } from "@/lib/company-identity"
import { useI18n, type Language } from "@/lib/i18n"

type CompanyInfoCopy = {
  title: string
  description: string
  fields: { label: string; value: string }[]
}

const companyInfoCopy: Record<Language, CompanyInfoCopy> = {
  zh: {
    title: "公司主体信息",
    description: "以下信息用于官网主体展示与服务确认。",
    fields: [
      {
        label: "公司名称",
        value: companyIdentity.legalName,
      },
      {
        label: "注册地",
        value: companyIdentity.registrationPlace,
      },
      {
        label: "客服时间",
        value: companyIdentity.customerServiceHours,
      },
    ],
  },
  en: {
    title: "Company Information",
    description:
      "This information is provided for entity disclosure and service confirmation.",
    fields: [
      {
        label: "Company name",
        value: companyIdentity.legalName,
      },
      {
        label: "Place of registration",
        value: companyIdentity.registrationPlace,
      },
      {
        label: "Customer Service",
        value: companyIdentity.customerServiceHours,
      },
    ],
  },
}

function ContactPage() {
  const { language } = useI18n()
  const { content } = useCmsContent()
  const copy = defaultContactPage[language]
  const settings = content.contactPage?.[language]
  const contactEmail =
    settings?.contactEmail ||
    copy.contactEmail ||
    companyIdentity.contactEmail
  const contactQrImage = settings?.qrImage || copy.qrImage || "/wechat_qrcode.jpg"
  const companyInfo = companyInfoCopy[language]
  const methods = copy.methods
    .filter((method) => method.id !== "phone-wechat")
    .map((method) => {
      if (method.id === "support-email") {
        return { ...method, text: contactEmail }
      }

      if (method.id === "company") {
        return { ...method, text: companyIdentity.legalName }
      }

      return method
    })
  const addressLabel = language === "zh" ? "注册地址" : "Registered Address"

  return (
    <>
      <PageHero
        kicker={copy.kicker}
        title={copy.heroTitle}
        description={copy.heroDescription}
      />
      <section
        data-scroll-reveal="false"
        className="py-14 transition-colors duration-300 sm:py-20"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-lg bg-card/86 p-6 shadow-lg shadow-blue-100/50 dark:bg-slate-900/82 dark:shadow-blue-950/20">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              {copy.contactTitle}
            </h2>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
              <img
                alt={copy.qrTitle || "微信二维码"}
                className="mx-auto size-36 shrink-0 rounded-xl bg-white object-cover p-2 shadow-sm ring-1 ring-blue-100 sm:mx-0 sm:size-40 dark:ring-white/10"
                loading="lazy"
                src={contactQrImage}
              />
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                    {language === "zh" ? "客服邮箱" : "Support email"}
                  </div>
                  <a
                    className="mt-1 inline-flex items-center gap-2 text-sm font-semibold break-all text-slate-800 transition hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-200"
                    href={`mailto:${contactEmail}`}
                  >
                    <EnvelopeSimple className="shrink-0" size={16} weight="bold" />
                    {contactEmail}
                  </a>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                    {addressLabel}
                  </div>
                  <div className="mt-1 flex items-start gap-2 text-sm leading-6 font-semibold text-slate-800 dark:text-slate-100">
                    <MapPin
                      className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
                      size={16}
                      weight="fill"
                    />
                    <span>{companyIdentity.registeredOffice}</span>
                  </div>
                </div>
                <Button asChild className="w-fit" variant="brand">
                  <a href={`mailto:${contactEmail}`}>
                    <EnvelopeSimple weight="bold" />
                    {contactEmail}
                  </a>
                </Button>
              </div>
            </div>

            <div className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 dark:border-white/10">
              {methods.map((method) => (
                <div key={method.label}>
                  <div className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                    {method.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold break-words text-slate-800 dark:text-slate-100">
                    {method.text}
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                  {copy.serviceArea}
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {copy.serviceAreaText}
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-border pt-6 dark:border-white/10">
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                {companyInfo.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {companyInfo.description}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {companyInfo.fields.map((field) => (
                  <div key={field.label}>
                    <div className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                      {field.label}
                    </div>
                    <div className="mt-1 text-sm leading-6 font-semibold break-words text-slate-800 dark:text-slate-100">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}

export { ContactPage }
