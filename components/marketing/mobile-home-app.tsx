"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { ArrowRight } from "@phosphor-icons/react"

import { AreasSection } from "@/components/sections/areas-section"
import { CtaSection } from "@/components/sections/cta-section"
import { GoldAuntiesSection } from "@/components/sections/gold-aunties-section"
import { HomeAboutStorySection } from "@/components/sections/home-about-story-section"
import { ProblemsSection } from "@/components/sections/problems-section"
import { ProcessSection } from "@/components/sections/process-section"
import { ServicesSection } from "@/components/sections/services-section"
import { ServiceVideoGallerySection } from "@/components/sections/service-video-gallery-section"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { ValuesSection } from "@/components/sections/values-section"
import { WhySection } from "@/components/sections/why-section"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { Link } from "@/lib/router-compat"

const statItems = [
  { value: "100000+", label: { zh: "累计服务", en: "Orders served" } },
  { value: "100+", label: { zh: "服务阿姨", en: "Aunties" } },
  { value: "97%", label: { zh: "客户好评", en: "Positive rate" } },
  { value: "7 年", label: { zh: "经验沉淀", en: "Experience" } },
] as const

const founderImages = [
  { src: "/founders/founder-will.webp", position: "50% 22%" },
  { src: "/founders/founder-isaac.webp", position: "50% 18%" },
  { src: "/founders/founder-fan.webp", position: "50% 18%" },
] as const

function MobileHomeApp() {
  const { dict, language } = useI18n()
  const typedWord = useTypingWords(dict.hero.typingWords)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7fb] pb-[92px] text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="relative isolate h-[100svh] overflow-hidden bg-slate-950 px-4 pt-[calc(76px+env(safe-area-inset-top))] text-white">
        <div className="absolute inset-0 -z-30 bg-slate-950">
          <Image
            src="/about_us_mobile.webp"
            alt=""
            fill
            fetchPriority="high"
            loading="lazy"
            sizes="(max-width: 767px) 100vw, 1px"
            className="object-cover object-top opacity-100 saturate-[1.04]"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.78)_0%,rgba(2,6,23,0.22)_34%,rgba(2,6,23,0.02)_58%,rgba(2,6,23,0.5)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-md">
          <h1 className="max-w-[21rem] text-[1.65rem] leading-[1.12] font-semibold tracking-normal text-white [text-shadow:0_2px_12px_rgba(2,6,23,0.5)]">
            <span className="mb-1.5 block text-base leading-tight font-medium text-white/90">
              {dict.hero.titleLineOne}
            </span>
            <span className="block">{dict.hero.titleLineTwo}</span>
            <span
              aria-live="polite"
              className="mt-2 block min-h-[1.12em] text-blue-200"
            >
              {typedWord}
              <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.08em] animate-pulse bg-blue-200" />
            </span>
          </h1>
          <p className="mt-3 max-w-[18.5rem] text-[13px] leading-6 whitespace-pre-line text-white/88">
            {dict.hero.description}
          </p>
          <div className="mt-4 flex">
            <Button
              asChild
              className="h-10 px-3 text-xs"
              size="lg"
              variant="heroPrimary"
            >
              <Link to="/booking">
                {dict.hero.primaryCta} <ArrowRight weight="bold" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-10 mx-auto grid max-w-md grid-cols-2 overflow-hidden rounded-xl border border-white/60 bg-white/95 text-slate-950 shadow-lg shadow-slate-950/8 dark:border-white/10 dark:bg-slate-900/90 dark:text-white">
          {statItems.map((item) => (
            <div
              key={item.label.zh}
              className="border-blue-100 p-2.5 text-center odd:border-r nth-[n+3]:border-t dark:border-white/10"
            >
              <div className="text-[10px] leading-4 font-semibold text-slate-600 dark:text-slate-300">
                {item.label[language]}
              </div>
              <div className="mt-1 text-lg leading-none font-semibold tracking-normal text-blue-700 dark:text-white">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <HomeAboutStorySection />
      <ProblemsSection />
      <ServicesSection anchorPrefix="mobile-" id="mobile-service-details" />
      <WhySection />
      <ValuesSection />
      <ProcessSection />
      <AreasSection id="mobile-areas" />

      <MobileFounderSection
        description={dict.founderTeam.description}
        founders={dict.founderTeam.members}
        kicker={dict.founderTeam.kicker}
        title={dict.founderTeam.title}
      />

      <GoldAuntiesSection id="mobile-gold-aunties" />

      <TestimonialsSection />
      <ServiceVideoGallerySection />
      <CtaSection />
    </main>
  )
}

function MobileFounderSection({
  description,
  founders,
  kicker,
  title,
}: {
  description: string
  founders: ReadonlyArray<{
    name: string
    role: string
    text: string
    title: string
  }>
  kicker: string
  title: string
}) {
  return (
    <section id="mobile-team" className="mx-auto mt-5 max-w-md px-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <MobileSectionHeading
          description={description}
          kicker={kicker}
          title={title}
        />

        <div className="mt-4 grid gap-3">
          {founders.map((founder, index) => {
            const image = founderImages[index] ?? founderImages[0]

            return (
              <article
                key={founder.name}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/5"
              >
                <Image
                  alt={`${founder.name} ${founder.role}`}
                  className="size-16 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
                  height={64}
                  loading="lazy"
                  src={image.src}
                  style={{ objectPosition: image.position }}
                  width={64}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-semibold">{founder.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-blue-400/10 dark:text-blue-200">
                      {founder.role}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-blue-700 dark:text-blue-200">
                    {founder.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {founder.text}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function MobileSectionHeading({
  description,
  kicker,
  title,
}: {
  description?: string
  kicker: string
  title: string
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase dark:text-blue-300">
        {kicker}
      </div>
      <h2 className="mt-1 text-base font-semibold tracking-normal">{title}</h2>
      {description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  )
}

function useTypingWords(words: readonly string[]) {
  const [wordIndex, setWordIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (words.length === 0) {
      return
    }

    const currentWord = words[wordIndex] ?? ""
    const timeout = window.setTimeout(
      () => {
        if (!isDeleting && charCount < currentWord.length) {
          setCharCount((count) => count + 1)
          return
        }

        if (!isDeleting && charCount === currentWord.length) {
          setIsDeleting(true)
          return
        }

        if (isDeleting && charCount > 0) {
          setCharCount((count) => count - 1)
          return
        }

        setIsDeleting(false)
        setWordIndex((index) => (index + 1) % words.length)
      },
      isDeleting ? 44 : charCount === currentWord.length ? 1300 : 82
    )

    return () => window.clearTimeout(timeout)
  }, [charCount, isDeleting, wordIndex, words])

  return (words[wordIndex] ?? "").slice(0, charCount)
}

export { MobileHomeApp }
