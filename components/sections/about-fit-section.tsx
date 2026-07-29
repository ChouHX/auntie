import { ArrowRight } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import { Section } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { Link } from "@/lib/router-compat"

function AboutFitSection() {
  const { dict } = useI18n()
  const fit = dict.aboutFit

  return (
    <Section className="border-y border-border bg-white/55 py-14 sm:py-20 dark:border-white/10 dark:bg-white/[0.025]">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
        <div>
          <h2 className="text-2xl leading-tight font-semibold text-slate-950 sm:text-3xl dark:text-white">
            {fit.title}
          </h2>
          <Button asChild className="mt-6 active:scale-[0.98]" variant="brand">
            <Link to="/booking">
              {fit.button}
              <ArrowRight weight="bold" />
            </Link>
          </Button>
        </div>

        <div className="space-y-5 text-base leading-8 text-slate-600 dark:text-slate-300">
          {fit.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                "emphasis" in paragraph && paragraph.emphasis
                  ? "text-xl leading-8 font-semibold text-slate-950 dark:text-white"
                  : undefined
              }
            >
              {renderInlineText(paragraph.parts)}
            </p>
          ))}
        </div>
      </div>
    </Section>
  )
}

type InlineTextPart = {
  bold?: boolean
  text: string
}

function renderInlineText(parts: readonly InlineTextPart[]): ReactNode {
  return parts.map((part, index) =>
    part.bold ? (
      <strong
        className="font-semibold text-slate-900 dark:text-white"
        key={index}
      >
        {part.text}
      </strong>
    ) : (
      <span key={index}>{part.text}</span>
    )
  )
}

export { AboutFitSection }
