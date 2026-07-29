import {
  CalendarCheck,
  ChatCircleText,
  Heart,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react"

import { Section, SectionHeading } from "@/components/common/section"
import { useI18n } from "@/lib/i18n"

const valueIcons = [ShieldCheck, Sparkle, CalendarCheck, ChatCircleText]

function ValuesSection() {
  const { dict } = useI18n()
  const about = dict.aboutPage

  return (
    <Section id="values" className="py-14 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
        <div>
          <SectionHeading
            description={about.valuesDescription}
            kicker={about.valuesTitle}
            title={about.valuesKicker}
            titleClassName="tracking-normal"
          />
          <div className="mt-7 flex gap-3 rounded-lg bg-blue-700 p-4 text-white shadow-lg shadow-blue-950/15">
            <Heart className="mt-0.5 shrink-0" size={20} weight="fill" />
            <div>
              <h3 className="font-semibold">{about.valuesFeatureTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-blue-50/85">
                {about.valuesFeatureText}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border dark:border-white/10">
          {about.values.map((item, index) => {
            const Icon = valueIcons[index % valueIcons.length]

            return (
              <article
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 border-b border-border py-5 dark:border-white/10"
                key={item.title}
              >
                <div className="flex size-11 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                  <Icon aria-hidden="true" size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.text}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export { ValuesSection }
