import { PageHero } from "@/components/common/page-hero"
import { AboutFitSection } from "@/components/sections/about-fit-section"
import { AboutSection } from "@/components/sections/about-section"
import { BlogPreviewSection } from "@/components/sections/blog-preview-section"
import { CtaSection } from "@/components/sections/cta-section"
import { ValuesSection } from "@/components/sections/values-section"
import { useI18n } from "@/lib/i18n"

function AboutPage() {
  const { dict } = useI18n()

  return (
    <>
      <PageHero
        kicker={dict.aboutPage.kicker}
        title={dict.aboutPage.heroTitle}
        description={dict.aboutPage.heroDescription}
      />
      <AboutSection />
      <AboutFitSection />
      <ValuesSection />
      <BlogPreviewSection />
      <CtaSection />
    </>
  )
}

export { AboutPage }
