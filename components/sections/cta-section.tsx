import { ChatCircleText } from "@phosphor-icons/react"
import { Link } from "@/lib/router-compat"

import { SectionKicker } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

function CtaSection() {
  const { dict } = useI18n()

  return (
    <section id="contact" className="py-12 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[18px] border border-border bg-card/92 p-5 text-slate-950 shadow-xl shadow-blue-100/50 sm:rounded-[20px] sm:p-12 lg:p-14 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:shadow-blue-950/30">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-blue-100/70 opacity-70 dark:bg-white/10 dark:opacity-40" />
          <div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-blue-200/40 opacity-70 dark:bg-blue-300/20 dark:opacity-40" />
          <div className="relative grid gap-5 sm:gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionKicker className="text-blue-700 dark:text-blue-100">
                {dict.cta.kicker}
              </SectionKicker>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.045em] sm:mt-4 sm:text-5xl">
                {dict.cta.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 dark:text-blue-50/80">
                {dict.cta.description}
              </p>
            </div>
            <div className="hover-lift rounded-xl border border-border bg-blue-50/70 p-4 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100/60 sm:p-6 dark:border-white/15 dark:bg-white/10 dark:shadow-none dark:hover:shadow-blue-950/30">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-blue-600 text-white shadow-lg shadow-blue-200/70 sm:size-12 dark:bg-white dark:text-blue-700 dark:shadow-none">
                  <ChatCircleText className="size-5 sm:size-6" weight="fill" />
                </div>
                <div>
                  <div className="font-semibold">{dict.cta.cardTitle}</div>
                  <div className="text-sm text-slate-500 dark:text-blue-50/70">
                    {dict.cta.cardText}
                  </div>
                </div>
              </div>
              <Button asChild className="mt-4 w-full sm:mt-6" variant="brand">
                <Link to="/booking">{dict.cta.button}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { CtaSection }
