"use client"

import { useRef } from "react"

import { MobileHomeApp } from "@/components/marketing/mobile-home-app"
import { AreasSection } from "@/components/sections/areas-section"
import { CtaSection } from "@/components/sections/cta-section"
import { FounderTeamSection } from "@/components/sections/founder-team-section"
import { GoldAuntiesSection } from "@/components/sections/gold-aunties-section"
import { HeroSection } from "@/components/sections/hero-section"
import { HomeAboutStorySection } from "@/components/sections/home-about-story-section"
import { ProblemsSection } from "@/components/sections/problems-section"
import { ProcessSection } from "@/components/sections/process-section"
import { ServicesSection } from "@/components/sections/services-section"
import { ServiceVideoGallerySection } from "@/components/sections/service-video-gallery-section"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { ValuesSection } from "@/components/sections/values-section"
import { WhySection } from "@/components/sections/why-section"
import { useHomeGsapScroll } from "@/hooks/use-home-gsap-scroll"

function HomePage() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useHomeGsapScroll(rootRef)

  return (
    <>
      <div className="md:hidden">
        <MobileHomeApp />
      </div>
      <div ref={rootRef} className="hidden overflow-x-clip md:block">
        <HeroSection />
        <HomeAboutStorySection />
        <ProblemsSection />
        <ServicesSection />
        <WhySection />
        <ValuesSection />
        <ProcessSection />
        <AreasSection />
        <FounderTeamSection />
        <GoldAuntiesSection />
        <TestimonialsSection />
        <ServiceVideoGallerySection />
        <CtaSection />
      </div>
    </>
  )
}

export { HomePage }
