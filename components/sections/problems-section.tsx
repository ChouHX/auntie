import { Section, SectionHeading } from "@/components/common/section"
import { BrandComparisonTable } from "@/components/sections/brand-comparison-section"
import { useI18n } from "@/lib/i18n"

function ProblemsSection() {
  const { dict } = useI18n()

  return (
    <Section id="problems" className="py-10 sm:py-14">
      <SectionHeading
        kicker={dict.problemsSection.kicker}
        title={dict.problemsSection.title}
        description={dict.problemsSection.description}
        align="center"
      />

      <BrandComparisonTable className="mt-6 sm:mt-8" />
    </Section>
  )
}

export { ProblemsSection }
