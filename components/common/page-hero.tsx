import type { ReactNode } from "react"

import { SectionKicker } from "@/components/common/section"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  kicker: ReactNode
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}

function PageHero({
  kicker,
  title,
  description,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      data-scroll-reveal="false"
      className={cn(
        "relative overflow-hidden border-b border-border pt-24 pb-7 transition-colors duration-300 sm:pt-36 sm:pb-20 dark:border-white/10",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(180deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40 sm:opacity-70" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#dff3ff]/75 to-transparent sm:h-40 dark:from-slate-950" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-up">
          <SectionKicker className="max-sm:text-[11px]">{kicker}</SectionKicker>
          <h1
            className={cn(
              "mt-2 text-2xl leading-snug font-semibold tracking-normal text-balance text-slate-950 sm:mt-4 sm:text-5xl sm:leading-tight dark:text-white"
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                "mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-5 sm:line-clamp-none sm:text-lg sm:leading-8 dark:text-slate-300"
              )}
            >
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  )
}

export { PageHero }
