import { Section, SectionHeading } from "@/components/common/section"
import { BrandComparisonImage } from "@/components/sections/brand-comparison-section"
import { useI18n } from "@/lib/i18n"

function ProblemsSection() {
  const { dict } = useI18n()

  return (
    <Section className="py-10 sm:py-14">
      <SectionHeading
        kicker={dict.problemsSection.kicker}
        title={dict.problemsSection.title}
        description={dict.problemsSection.description}
        align="center"
      />

      <BrandComparisonImage className="mt-6 sm:mt-8" />
    </Section>
  )
}

export { ProblemsSection }
