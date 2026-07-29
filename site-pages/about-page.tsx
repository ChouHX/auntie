import {
  Briefcase,
  ChatCircleDots,
  Heart,
  UsersThree,
} from "@phosphor-icons/react"

import { AboutFitSection } from "@/components/sections/about-fit-section"
import { AboutSection } from "@/components/sections/about-section"
import { BlogPreviewSection } from "@/components/sections/blog-preview-section"
import { CtaSection } from "@/components/sections/cta-section"
import { ValuesSection } from "@/components/sections/values-section"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { Link } from "@/lib/router-compat"
import { ContactPage } from "@/site-pages/contact-page"
import { JoinPage } from "@/site-pages/join-page"

function AboutPage() {
  const { dict } = useI18n()

  const sectionLinks = [
    {
      href: "/about#story",
      icon: UsersThree,
      label: dict.aboutPage.sectionKicker,
    },
    { href: "/about#values", icon: Heart, label: dict.aboutPage.valuesTitle },
    { href: "/about#join", icon: Briefcase, label: dict.nav.join },
    { href: "/about#contact", icon: ChatCircleDots, label: dict.nav.contact },
  ]

  return (
    <>
      <section
        className="relative flex min-h-[min(38rem,calc(100svh-7rem))] items-end overflow-hidden bg-slate-950 pt-24 text-white sm:min-h-[min(44rem,calc(100svh-6rem))] sm:pt-32"
        data-scroll-reveal="false"
      >
        <picture className="absolute inset-0">
          <source media="(max-width: 639px)" srcSet="/about_us_mobile.webp" />
          <img
            alt={dict.aboutPage.imageAlt}
            className="size-full object-cover object-center"
            fetchPriority="high"
            src="/about_us.webp"
          />
        </picture>
        <div className="absolute inset-0 bg-slate-950/58" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16">
          <div className="animate-fade-up max-w-3xl">
            <p className="text-sm font-semibold text-blue-100">
              {dict.common.brandName}
            </p>
            <h1 className="mt-3 text-3xl leading-tight font-semibold text-balance sm:text-5xl sm:leading-tight">
              {dict.aboutPage.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-50/88 sm:text-lg sm:leading-8">
              {dict.aboutPage.heroDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="active:scale-[0.98]"
                variant="brandStrong"
              >
                <Link to="/about#join">
                  <Briefcase weight="fill" />
                  {dict.nav.join}
                </Link>
              </Button>
              <Button
                asChild
                className="border-white/35 bg-white/12 text-white backdrop-blur-xl hover:bg-white/20 hover:text-white active:scale-[0.98]"
                variant="outline"
              >
                <Link to="/about#contact">
                  <ChatCircleDots weight="fill" />
                  {dict.nav.contact}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label={dict.nav.about}
        className="sticky top-[60px] z-30 border-b border-white/50 bg-white/78 backdrop-blur-xl md:top-[72px] dark:border-white/10 dark:bg-slate-950/78"
      >
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 sm:justify-center sm:px-6 lg:px-8">
          {sectionLinks.map((item) => {
            const Icon = item.icon

            return (
              <Link
                className="flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-950/5 hover:text-slate-950 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                key={item.href}
                to={item.href}
              >
                <Icon aria-hidden="true" size={17} weight="bold" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <AboutSection />
      <AboutFitSection />
      <ValuesSection />
      <JoinPage embedded />
      <ContactPage embedded />
      <BlogPreviewSection />
      <CtaSection />
    </>
  )
}

export { AboutPage }
