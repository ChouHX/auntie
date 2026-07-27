import { ArrowRight } from "@phosphor-icons/react"
import { Link } from "@/lib/router-compat"
import type { ReactNode } from "react"

import { Section } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

function AboutFitSection() {
  const { dict } = useI18n()
  const fit = dict.aboutFit

  return (
    <Section className="py-12 sm:py-16">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-white/74 px-5 py-10 text-center shadow-xl shadow-blue-100/40 sm:px-10 sm:py-12 dark:border-white/10 dark:bg-white/[0.05] dark:shadow-blue-950/20">
        <div className="relative">
          <h2 className="text-2xl leading-tight font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl dark:text-white">
            {fit.title}
          </h2>

          <div className="mx-auto mt-7 max-w-4xl space-y-5 text-left text-base leading-8 text-slate-600 sm:text-justify [text-align-last:left] dark:text-slate-300">
            {fit.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={
                  "emphasis" in paragraph && paragraph.emphasis
                    ? "text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white"
                    : undefined
                }
              >
                {renderInlineText(paragraph.parts)}
              </p>
            ))}
          </div>

          <Button
            asChild
            className="mt-8 px-7"
            variant="brand"
          >
            <Link to="/booking">
              {fit.button}
              <ArrowRight weight="bold" />
            </Link>
          </Button>
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
        key={index}
        className="font-semibold text-slate-900 dark:text-white"
      >
        {part.text}
      </strong>
    ) : (
      <span key={index}>{part.text}</span>
    )
  )
}

export { AboutFitSection }
