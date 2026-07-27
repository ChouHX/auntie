import { PageHero } from "@/components/common/page-hero"
import { CtaSection } from "@/components/sections/cta-section"
import { ProcessSection } from "@/components/sections/process-section"
import { useI18n } from "@/lib/i18n"

function ProcessPage() {
  const { dict } = useI18n()

  return (
    <>
      <PageHero
        kicker={dict.processPage.kicker}
        title={dict.processPage.heroTitle}
        description={dict.processPage.heroDescription}
      />
      <ProcessSection />
      <CtaSection />
    </>
  )
}

export { ProcessPage }
