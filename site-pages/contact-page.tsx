"use client"

import { EnvelopeSimple, MapPinLine, PhoneCall } from "@phosphor-icons/react"

import { PageHero } from "@/components/common/page-hero"
import { Section, SectionKicker } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { defaultContactPage } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n, type Language } from "@/lib/i18n"

type ContactPageCopy = {
  contactDescription: string
  contactTitle: string
  emailLabel: string
  phoneEmailLabel: string
  phoneLabel: string
}

const contactPageCopy: Record<Language, ContactPageCopy> = {
  zh: {
    contactDescription:
      "如有预约、付款、退款、售后或隐私相关问题，可以通过以下方式联系陈阿姨到家客服。",
    contactTitle: "客服联系方式",
    emailLabel: "邮箱",
    phoneEmailLabel: "电话 / 邮箱",
    phoneLabel: "电话",
  },
  en: {
    contactDescription:
      "For booking, payment, refund, after-service, or privacy questions, contact Auntie Chen Home support through the channels below.",
    contactTitle: "Support Contacts",
    emailLabel: "Email",
    phoneEmailLabel: "Phone / Email",
    phoneLabel: "Phone",
  },
}

type CompanyInfoCopy = {
  description: string
  fields: { label: string; value: string }[]
  title: string
}

const companyInfoCopy: Record<Language, CompanyInfoCopy> = {
  zh: {
    title: "公司主体信息",
    description: "以下信息用于官网主体展示、服务确认和支付审核资料核验。",
    fields: [
      {
        label: "公司名称",
        value: "AUNTIE CHEN HOME SOLUTIONS LIMITED",
      },
      {
        label: "公司注册地",
        value: "Hong Kong",
      },
      {
        label: "公司注册编号",
        value: "80754560",
      },
      {
        label: "商业登记证号码",
        value: "80754560-000-07-26-6",
      },
      {
        label: "注册办事处地址",
        value:
          "Room 9042, 9/F, Block B, Chung Mei Centre, 15-17 Hing Yip Street, Kwun Tong, Hong Kong",
      },
      {
        label: "客服时间",
        value: "24 hours",
      },
    ],
  },
  en: {
    title: "Company Information",
    description:
      "This information is provided for entity disclosure, service confirmation, and payment review.",
    fields: [
      {
        label: "Company name",
        value: "AUNTIE CHEN HOME SOLUTIONS LIMITED",
      },
      {
        label: "Place of registration",
        value: "Hong Kong",
      },
      {
        label: "Company Registration No.",
        value: "80754560",
      },
      {
        label: "Business Registration Certificate No.",
        value: "80754560-000-07-26-6",
      },
      {
        label: "Registered Office",
        value:
          "Room 9042, 9/F, Block B, Chung Mei Centre, 15-17 Hing Yip Street, Kwun Tong, Hong Kong",
      },
      {
        label: "Customer Service",
        value: "24 hours",
      },
    ],
  },
}

function ContactPage() {
  const { language } = useI18n()
  const { content } = useCmsContent(["contactPage"])
  const pageFallback = defaultContactPage[language]
  const pageContent = content.contactPage?.[language] ?? pageFallback
  const copy = contactPageCopy[language]
  const companyInfo = companyInfoCopy[language]
  const contactEmail = pageContent.contactEmail || pageFallback.contactEmail
  const contactPhone = pageContent.contactPhone || pageFallback.contactPhone

  return (
    <>
      <PageHero
        kicker={pageContent.kicker || pageFallback.kicker}
        title={pageContent.heroTitle || pageFallback.heroTitle}
        description={
          pageContent.heroDescription || pageFallback.heroDescription
        }
      />

      <Section className="py-8 sm:py-14" innerClassName="grid gap-5">
        <Card className="animate-fade-up rounded-xl bg-card/86 p-5 shadow-xl shadow-blue-100/45 sm:p-6 dark:bg-slate-900/82 dark:shadow-blue-950/22">
          <SectionKicker>
            {pageContent.contactTitle || copy.contactTitle}
          </SectionKicker>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {copy.contactDescription}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {copy.phoneEmailLabel}
              </div>
              <div className="mt-1 flex flex-col gap-1 text-sm leading-6 font-semibold break-words text-slate-900 dark:text-white">
                <a
                  className="inline-flex items-center gap-2 transition-colors hover:text-primary dark:hover:text-blue-200"
                  href={`tel:${createPhoneHref(contactPhone)}`}
                >
                  <PhoneCall
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                    size={16}
                    weight="bold"
                  />
                  {copy.phoneLabel}: {contactPhone}
                </a>
                <a
                  className="inline-flex items-center gap-2 transition-colors hover:text-primary dark:hover:text-blue-200"
                  href={`mailto:${contactEmail}`}
                >
                  <EnvelopeSimple
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                    size={16}
                    weight="bold"
                  />
                  {copy.emailLabel}: {contactEmail}
                </a>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {pageContent.serviceArea || pageFallback.serviceArea}
              </div>
              <div className="mt-1 text-sm leading-6 font-semibold break-words text-slate-900 dark:text-white">
                {pageContent.serviceAreaText || pageFallback.serviceAreaText}
              </div>
            </div>
          </div>
        </Card>

        <Card className="animate-fade-up rounded-xl bg-card/86 p-5 shadow-xl shadow-blue-100/45 sm:p-6 dark:bg-slate-900/82 dark:shadow-blue-950/22">
          <SectionKicker>{companyInfo.title}</SectionKicker>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {companyInfo.description}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {companyInfo.fields.map((field) => (
              <div
                className={
                  field.value.length > 48 ? "sm:col-span-2" : undefined
                }
                key={field.label}
              >
                <div className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {field.label}
                </div>
                <div className="mt-1 inline-flex items-start gap-2 text-sm leading-6 font-semibold break-words text-slate-900 dark:text-white">
                  {isAddressField(field.label) ? (
                    <MapPinLine
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-muted-foreground"
                      size={16}
                      weight="bold"
                    />
                  ) : null}
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </>
  )
}

function createPhoneHref(value: string) {
  return value.replace(/[^+\d]/g, "")
}

function isAddressField(label: string) {
  return label === "注册办事处地址" || label === "Registered Office"
}

export { ContactPage }
