import { HandHeart } from "@phosphor-icons/react"

import { Section, SectionHeading } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"

function AboutSection() {
  const { dict } = useI18n()
  const about = dict.aboutPage

  return (
    <Section id="about" className="overflow-hidden py-12 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(37,99,235,0.1),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(148,163,184,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_14%_10%,rgba(59,130,246,0.16),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(37,99,235,0.1),transparent_28%)]" />

      <div className="relative">
        <div className="mb-6 max-w-3xl">
          <SectionHeading
            kicker={about.sectionKicker}
            title={about.sectionTitle}
            description={about.sectionDescription}
            kickerClassName="text-sm tracking-[0.14em] sm:text-base"
            titleClassName="text-slate-950 dark:text-white"
          />
        </div>

        <Card className="animate-fade-up overflow-hidden rounded-2xl border-border bg-card/82 shadow-xl shadow-blue-100/60 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-blue-950/25">
          <div className="p-4 pb-0 sm:p-5 sm:pb-0">
            <figure className="mx-auto max-w-full overflow-hidden rounded-2xl">
              <div className="relative h-[260px] overflow-hidden rounded-2xl bg-blue-50/55 sm:h-[360px] lg:h-[430px] dark:bg-slate-950/50">
                <img
                  src="/about_us.png"
                  alt={about.imageAlt}
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/68 via-slate-950/24 to-transparent" />
                <figcaption className="absolute right-3 bottom-3 left-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/46 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-950/20 backdrop-blur-sm sm:right-4 sm:bottom-4 sm:left-4">
                  <HandHeart className="shrink-0 text-blue-200" weight="fill" />
                  {about.imageCaption}
                </figcaption>
              </div>
            </figure>
          </div>

          <div className="p-5 sm:p-6 lg:px-8 lg:pt-6 lg:pb-7">
            <div className="mx-auto max-w-5xl space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p className="text-base leading-8 font-medium text-slate-800 dark:text-slate-100">
                {about.storyIntro}
              </p>
              {about.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-blue-50/60 dark:border-white/10 dark:bg-white/[0.04]">
              {about.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="border-r border-border p-3 text-center last:border-r-0 dark:border-white/10"
                >
                  <div className="text-xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Section>
  )
}

export { AboutSection }
