import { useEffect, useState } from "react"
import { ArrowRight } from "@phosphor-icons/react"
import { Link } from "@/lib/router-compat"

import { CountUp } from "@/components/common/count-up"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

const heroBackgroundMask =
  "linear-gradient(to bottom, #000 0%, #000 58%, rgba(0, 0, 0, 0.82) 68%, rgba(0, 0, 0, 0.5) 79%, rgba(0, 0, 0, 0.2) 91%, transparent 100%)"

function HeroSection() {
  const { dict } = useI18n()
  const typedWord = useTypingWords(dict.hero.typingWords)

  return (
    <section
      data-gsap-hero
      data-scroll-reveal="false"
      className="relative isolate z-10 overflow-visible pt-[60px] text-slate-950 md:pt-[72px] dark:text-white"
    >
      <div
        data-gsap-hero-media
        className="pointer-events-none absolute inset-x-0 top-[60px] bottom-0 z-0 overflow-hidden md:top-[72px]"
        style={{
          WebkitMaskImage: heroBackgroundMask,
          maskImage: heroBackgroundMask,
        }}
      >
        <div className="absolute inset-0 bg-slate-950">
          <picture>
            <source media="(max-width: 767px)" srcSet="/about_us_mobile.png" />
            <img
              src="/about_us.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover object-center opacity-[1] saturate-[1.04] max-md:object-top dark:opacity-90 dark:saturate-100 lg:dark:opacity-100"
            />
          </picture>
          <div className="absolute inset-y-0 left-0 hidden w-[26vw] bg-gradient-to-r from-slate-950/68 via-slate-950/28 to-transparent md:block" />
          <div className="absolute inset-y-0 right-0 hidden w-[26vw] bg-gradient-to-l from-slate-950/52 via-slate-950/20 to-transparent md:block" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.78)_0%,rgba(2,6,23,0.22)_34%,rgba(2,6,23,0.02)_58%,rgba(2,6,23,0.5)_100%)] md:bg-slate-950/28" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(2,6,23,0.56)_0%,rgba(2,6,23,0.42)_34%,rgba(2,6,23,0.18)_64%,rgba(2,6,23,0.04)_100%)] md:block" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-60px)] max-w-7xl items-start px-4 pt-6 pb-[12rem] sm:min-h-[calc(100vh-60px)] sm:px-6 md:min-h-[calc(100vh-72px)] md:items-center md:py-20 lg:px-8">
        <div className="animate-fade-up max-w-[21rem] py-0 text-white [text-shadow:0_2px_12px_rgba(2,6,23,0.5)] md:max-w-4xl md:py-8 lg:-translate-y-8 lg:py-16">
          <h1 className="max-w-[1120px] text-[1.65rem] leading-[1.12] font-semibold tracking-normal text-white md:text-[3.45rem] lg:text-[3.95rem] xl:text-[4.35rem]">
            <span className="mb-1.5 block text-base leading-tight font-medium tracking-normal text-white/90 md:mb-3 md:text-[2.15rem] lg:text-[2.45rem]">
              {dict.hero.titleLineOne}
            </span>
            <span className="block">{dict.hero.titleLineTwo}</span>
            <span
              aria-live="polite"
              className="mt-2 block min-h-[1.12em] text-blue-200 md:mt-3 md:text-blue-400"
            >
              {typedWord}
              <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.08em] animate-pulse bg-blue-200 md:bg-blue-400" />
            </span>
          </h1>

          <p className="mt-3 max-w-[18.5rem] text-[13px] leading-6 whitespace-pre-line text-white/88 md:mt-7 md:max-w-3xl md:text-xl md:leading-9">
            {dict.hero.description}
          </p>

          <div className="mt-4 grid max-w-[21rem] grid-cols-2 gap-2 md:mt-9 md:flex md:max-w-none md:flex-row md:gap-3">
            <Button
              asChild
              size="lg"
              className="h-10 px-3 text-xs md:h-11 md:px-7 md:text-sm"
              variant="heroPrimary"
            >
              <Link to="/booking">
                {dict.hero.primaryCta} <ArrowRight weight="bold" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="hidden h-10 px-3 text-xs md:inline-flex md:h-11 md:px-7 md:text-sm"
              variant="heroSecondary"
            >
              <a href="#services">{dict.hero.secondaryCta}</a>
            </Button>
          </div>

          {/* <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {dict.hero.trustPoints.map((item, index) => (
              <div
                key={item}
                className="hover-lift animate-fade-up rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2.5 text-sm font-medium text-blue-50 shadow-lg shadow-blue-950/10 hover:border-blue-300/50 hover:bg-white/[0.12]"
                style={{ animationDelay: `${120 + index * 90}ms` }}
              >
                <CheckCircle
                  className="mr-2 inline text-blue-300"
                  weight="fill"
                />
                {item}
              </div>
            ))}
          </div> */}

          <div className="mt-4 hidden max-w-[21rem] grid-cols-4 overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-lg shadow-slate-950/8 md:mt-10 md:grid md:max-w-3xl md:rounded-2xl dark:border-white/10 dark:bg-slate-900/90 dark:shadow-xl dark:shadow-blue-950/18">
            {dict.hero.stats.map((stat) => (
              <HeroStat key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-10 grid grid-cols-2 overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-lg shadow-slate-950/8 md:hidden dark:border-white/10 dark:bg-slate-900/90 dark:shadow-xl dark:shadow-blue-950/18">
        {dict.hero.stats.map((stat) => (
          <HeroStat key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  )
}

function useTypingWords(words: readonly string[]) {
  const [wordIndex, setWordIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (words.length === 0) {
      return undefined
    }

    const currentWord = words[wordIndex % words.length] ?? ""
    const isWordComplete = !isDeleting && charCount >= currentWord.length
    const isWordDeleted = isDeleting && charCount === 0
    const delay = isWordComplete ? 1200 : isDeleting ? 48 : 86

    const timer = window.setTimeout(() => {
      if (isWordComplete) {
        setIsDeleting(true)
        return
      }

      if (isWordDeleted) {
        setIsDeleting(false)
        setWordIndex((current) => (current + 1) % words.length)
        return
      }

      setCharCount((current) => current + (isDeleting ? -1 : 1))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [charCount, isDeleting, wordIndex, words])

  return (words[wordIndex % Math.max(words.length, 1)] ?? "").slice(
    0,
    charCount
  )
}

type HeroStatProps = {
  stat: {
    label: string
    suffix: string
    to: number
  }
}

function HeroStat({ stat }: HeroStatProps) {
  return (
    <div className="border-r border-blue-100 p-2 text-center transition duration-300 [text-shadow:none] last:border-r-0 hover:bg-blue-50/72 md:p-5 dark:border-white/10 dark:hover:bg-white/[0.1]">
      <div className="text-[9px] leading-3.5 font-semibold text-slate-600 [text-shadow:none] md:text-xs md:leading-5 dark:text-slate-300">
        {stat.label}
      </div>
      <div className="mt-1 text-base font-semibold tracking-normal text-blue-700 [text-shadow:none] md:text-3xl dark:text-white">
        <CountUp
          to={stat.to}
          duration={2}
          separator=","
          className="inline-block"
        />
        {stat.suffix ? <span>{stat.suffix}</span> : null}
      </div>
    </div>
  )
}

export { HeroSection }
