import { highlights } from "@/data/site"
import { Section, SectionHeading } from "@/components/common/section"

function HighlightsSection() {
  return (
    <Section className="py-24 sm:py-24">
      <SectionHeading
        align="center"
        kicker="Service promise"
        title="用流程保证稳定，用细节建立信任"
      />
      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3 dark:border-white/10 dark:bg-white/10">
        {highlights.map(({ icon: IconComponent, title, text }) => (
          <article
            key={title}
            className="bg-card/82 p-8 backdrop-blur dark:bg-slate-900"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
              <IconComponent size={24} weight="fill" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {text}
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}

export { HighlightsSection }
