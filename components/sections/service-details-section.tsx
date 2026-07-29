import { CheckCircle } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import { Section } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type ServiceDetailsSectionProps = {
  className?: string
  embedded?: boolean
  id?: string
}

function ServiceDetailsSection({
  className,
  embedded = false,
  id,
}: ServiceDetailsSectionProps) {
  const { dict } = useI18n()
  const serviceDetails = dict.servicesSection.details

  const content: ReactNode = (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <div>
          <div className="text-xs font-semibold tracking-normal text-blue-700 uppercase dark:text-blue-200">
            {dict.servicesSection.kicker}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl dark:text-white">
            {dict.servicesSection.detailTitle}
          </h2>
        </div>
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          {dict.servicesSection.detailIntro}
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {serviceDetails.map((detail) => (
          <Card
            className="rounded-lg bg-card/82 p-4 shadow-sm shadow-blue-100/25 dark:bg-white/[0.055] dark:shadow-none"
            key={detail.title}
          >
            <h3 className="text-base font-semibold tracking-normal text-slate-950 dark:text-white">
              {detail.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {detail.text}
            </p>
            <div className="mt-4 grid gap-2">
              {detail.items.map((item) => (
                <div
                  className="flex items-start gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200"
                  key={item}
                >
                  <CheckCircle
                    className="mt-1 shrink-0 text-blue-700 dark:text-blue-300"
                    size={16}
                    weight="fill"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  )

  if (embedded) {
    return (
      <section
        className={cn("scroll-mt-24 pt-12 sm:pt-16", className)}
        id={id}
      >
        {content}
      </section>
    )
  }

  return (
    <Section className={cn("py-10 sm:py-12", className)} id={id}>
      {content}
    </Section>
  )
}

export { ServiceDetailsSection }
