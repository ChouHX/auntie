import { useState, type MouseEvent } from "react"

import { PageHero } from "@/components/common/page-hero"
import { Section } from "@/components/common/section"
import { ServiceDetailsSection } from "@/components/sections/service-details-section"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"

function FaqPage() {
  const { language } = useI18n()
  const { content: cmsContent } = useCmsContent(["faq"])
  const content = cmsContent.faq[language]
  const defaultOpenItems = content.items
    .slice(0, 3)
    .map((_, index) => `faq-${index + 1}`)
  const [openItems, setOpenItems] = useState<string[]>(() => {
    const hashValue = window.location.hash.replace("#", "")
    const hashIndex = Number(hashValue.replace("faq-", ""))
    const isValidFaqHash =
      hashValue.startsWith("faq-") &&
      Number.isInteger(hashIndex) &&
      hashIndex >= 1 &&
      hashIndex <= content.items.length

    return isValidFaqHash
      ? Array.from(new Set([...defaultOpenItems, hashValue]))
      : defaultOpenItems
  })

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    value: string
  ) => {
    event.preventDefault()
    setOpenItems((current) =>
      current.includes(value) ? current : [...current, value]
    )
    window.history.replaceState(null, "", `#${value}`)
    window.requestAnimationFrame(() => {
      document.getElementById(value)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  return (
    <>
      <PageHero
        kicker={content.kicker}
        title={content.title}
        description={content.description}
      />
      <ServiceDetailsSection />
      <Section className="py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <Card className="sticky top-24 rounded-xl bg-card/82 p-4 shadow-xl shadow-blue-100/45 dark:bg-slate-900/80 dark:shadow-blue-950/25">
              <div className="px-2 text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
                {content.navLabel}
              </div>
              <nav className="mt-3 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                {content.items.map((item, index) => {
                  const value = `faq-${index + 1}`
                  const question = formatFaqQuestion(item.question, index)

                  return (
                    <a
                      key={`${value}-${item.question}`}
                      className="block rounded-md px-2 py-2 text-xs leading-5 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-200"
                      href={`#${value}`}
                      onClick={(event) => handleNavClick(event, value)}
                    >
                      {question}
                    </a>
                  )
                })}
              </nav>
            </Card>
          </aside>

          <div className="min-w-0">
            <Card className="rounded-xl bg-card/82 p-5 shadow-xl shadow-blue-100/50 sm:p-6 dark:bg-slate-900/80 dark:shadow-blue-950/25">
              <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
                {content.introLabel}
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {content.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Card>

            <Accordion
              className="mt-5 space-y-3"
              onValueChange={setOpenItems}
              type="multiple"
              value={openItems}
            >
              {content.items.map((item, index) => {
                const value = `faq-${index + 1}`
                const question = formatFaqQuestion(item.question, index)

                return (
                  <AccordionItem
                    key={`${value}-${item.question}`}
                    id={value}
                    value={value}
                    className="scroll-mt-24 rounded-xl border border-border bg-card/88 shadow-sm shadow-blue-100/30 transition-[border-color,box-shadow,background-color] duration-300 data-[state=open]:shadow-lg data-[state=open]:shadow-blue-100/45 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none"
                  >
                    <AccordionTrigger className="px-5 py-4 text-base">
                      <span>{question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 border-t border-border px-5 py-4 leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300">
                      {item.answer.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        </div>
      </Section>
    </>
  )
}

function formatFaqQuestion(question: string, index: number) {
  const text = question.replace(/^\s*\d+[.、]\s*/, "").trim()
  return `${index + 1}. ${text || "未命名问题"}`
}

export { FaqPage }
