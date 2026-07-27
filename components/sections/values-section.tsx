import {
  CalendarCheck,
  ChatCircleText,
  Heart,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react"

import { Section, SectionHeading } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"

const valueIcons = [ShieldCheck, Sparkle, CalendarCheck, ChatCircleText]

function ValuesSection() {
  const { dict } = useI18n()
  const about = dict.aboutPage

  return (
    <Section className="py-10 sm:py-16">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
        <div className="grid gap-4 sm:gap-5">
          <SectionHeading
            kicker={about.valuesTitle}
            title={about.valuesKicker}
            description={about.valuesDescription}
            descriptionClassName="max-sm:line-clamp-2"
            kickerClassName="text-xs tracking-[0.14em] sm:text-base"
            titleClassName="text-slate-950 dark:text-white"
          />

          <Card className="relative overflow-hidden rounded-xl border-white/10 bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 p-3.5 text-white shadow-xl shadow-blue-950/20 sm:rounded-2xl sm:p-5 sm:shadow-2xl sm:shadow-blue-950/25">
            <div className="absolute -top-16 -right-16 size-44 rounded-full bg-white/10 opacity-40" />
            <div className="relative flex items-start gap-3 sm:gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 sm:size-11 sm:rounded-xl">
                <Heart className="size-4 sm:size-5" weight="fill" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-[-0.02em] sm:text-base">
                  {about.valuesFeatureTitle}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-blue-50/75 sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-6">
                  {about.valuesFeatureText}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {about.values.map((item, index) => {
            const IconComponent = valueIcons[index % valueIcons.length]

            return (
              <Card
                key={item.title}
                className="hover-lift animate-fade-up rounded-xl bg-card/88 p-3 shadow-md shadow-blue-100/35 hover:shadow-xl hover:shadow-blue-100/60 sm:rounded-2xl sm:p-5 sm:shadow-lg sm:shadow-blue-100/45 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none dark:hover:shadow-blue-950/30"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 sm:size-10 sm:rounded-xl dark:bg-blue-500/15 dark:text-blue-200">
                    <IconComponent className="size-4 sm:size-5" weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm leading-snug font-semibold text-slate-950 sm:text-base dark:text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-6 dark:text-slate-300">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export { ValuesSection }
