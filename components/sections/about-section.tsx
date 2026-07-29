import { Section, SectionHeading } from "@/components/common/section"
import { useI18n } from "@/lib/i18n"

function AboutSection() {
  const { dict } = useI18n()
  const about = dict.aboutPage

  return (
    <Section id="story" className="py-14 sm:py-24">
      <SectionHeading
        className="max-w-3xl"
        description={about.sectionDescription}
        kicker={about.sectionKicker}
        title={about.sectionTitle}
        titleClassName="tracking-normal"
      />

      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.7fr)] lg:gap-16">
        <div className="space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
          <p className="text-lg leading-8 font-semibold text-slate-950 dark:text-white">
            {about.storyIntro}
          </p>
          {about.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <dl className="border-y border-border lg:border-y-0 lg:border-l dark:border-white/10">
          {about.stats.map((stat) => (
            <div
              className="border-b border-border px-1 py-5 last:border-b-0 lg:px-7 dark:border-white/10"
              key={stat.label}
            >
              <dd className="text-3xl font-semibold text-slate-950 dark:text-white">
                {stat.value}
              </dd>
              <dt className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}

export { AboutSection }
