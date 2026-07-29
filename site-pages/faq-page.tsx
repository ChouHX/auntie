import { MagnifyingGlass, Question, X } from "@phosphor-icons/react"
import { useMemo, useState, type MouseEvent } from "react"

import { PageHero } from "@/components/common/page-hero"
import { Section, SectionKicker } from "@/components/common/section"
import { ServiceDetailsSection } from "@/components/sections/service-details-section"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const faqInterfaceCopy = {
  zh: {
    clear: "清除搜索",
    empty: "没有找到匹配的问题，请换一个关键词。",
    result: (count: number) => `找到 ${count} 个问题`,
    search: "搜索问题或答案",
  },
  en: {
    clear: "Clear search",
    empty: "No matching questions. Try another keyword.",
    result: (count: number) =>
      `${count} question${count === 1 ? "" : "s"} found`,
    search: "Search questions or answers",
  },
} as const

function FaqPage() {
  const { dict, language } = useI18n()
  const { content: cmsContent } = useCmsContent(["faq"])
  const content = cmsContent.faq[language]
  const copy = faqInterfaceCopy[language]
  const [query, setQuery] = useState("")
  const [openItem, setOpenItem] = useState<string | undefined>(() =>
    getInitialOpenItem(content.items.length)
  )
  const [activeAnchor, setActiveAnchor] = useState<string | undefined>(() =>
    getInitialActiveAnchor(content.items.length)
  )
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(language)

    return content.items
      .map((item, index) => ({ index, item }))
      .filter(({ item }) => {
        if (!normalizedQuery) return true

        return [item.question, ...item.answer]
          .join(" ")
          .toLocaleLowerCase(language)
          .includes(normalizedQuery)
      })
  }, [content.items, language, query])

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, value: string) {
    event.preventDefault()
    setOpenItem(value)
    scrollToAnchor(value, "center")
  }

  function handleServiceDetailsClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    scrollToAnchor("service-details")
  }

  function scrollToAnchor(
    value: string,
    block: ScrollLogicalPosition = "start"
  ) {
    setActiveAnchor(value)
    window.history.replaceState(null, "", `#${value}`)
    window.requestAnimationFrame(() => {
      document.getElementById(value)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block,
      })
    })
  }

  function handleOpenChange(nextItem: string) {
    const value = nextItem || undefined
    setOpenItem(value)

    if (value) {
      setActiveAnchor(value)
      window.history.replaceState(null, "", `#${value}`)
    }
  }

  return (
    <>
      <PageHero
        className="pb-8 sm:pb-12"
        description={content.description}
        kicker={content.kicker}
        title={content.title}
      >
        <div className="mt-5 max-w-2xl">
          <label className="sr-only" htmlFor="faq-search">
            {copy.search}
          </label>
          <div className="relative">
            <MagnifyingGlass
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500"
              size={19}
              weight="bold"
            />
            <Input
              autoComplete="off"
              className="h-12 rounded-lg border-white/70 bg-white/95 pr-12 pl-11 shadow-sm dark:border-white/10 dark:bg-slate-950/95"
              id="faq-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
              type="search"
              value={query}
            />
            {query ? (
              <Button
                aria-label={copy.clear}
                className="absolute top-1/2 right-2 size-8 -translate-y-1/2 active:scale-95"
                onClick={() => setQuery("")}
                size="icon-sm"
                title={copy.clear}
                type="button"
                variant="ghost"
              >
                <X size={16} weight="bold" />
              </Button>
            ) : null}
          </div>
          <p
            aria-live="polite"
            className="mt-2 text-xs text-slate-500 dark:text-slate-400"
          >
            {copy.result(filteredItems.length)}
          </p>
        </div>
      </PageHero>

      <Section className="py-10 sm:py-16" data-scroll-reveal="false">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="max-h-[calc(100svh-7rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-white/95 p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/95">
              <SectionKicker className="tracking-normal">
                {content.navLabel}
              </SectionKicker>
              <nav className="mt-2">
                <div>
                  {filteredItems.map(({ index, item }) => {
                    const value = `faq-${index + 1}`
                    const question = formatFaqQuestion(item.question, index)

                    return (
                      <a
                        className={cn(
                          "block rounded-md px-2 py-2.5 text-xs leading-5 text-slate-600 transition-colors hover:bg-slate-950/5 hover:text-slate-950 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white",
                          activeAnchor === value &&
                            "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/12 dark:text-blue-200"
                        )}
                        href={`#${value}`}
                        key={`${value}-${item.question}`}
                        onClick={(event) => handleNavClick(event, value)}
                      >
                        {question}
                      </a>
                    )
                  })}
                </div>
                <div className="mt-2 border-t border-border pt-2 dark:border-white/10">
                  <a
                    className={cn(
                      "block rounded-md px-2 py-2.5 text-xs leading-5 text-slate-600 transition-colors hover:bg-slate-950/5 hover:text-slate-950 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white",
                      activeAnchor === "service-details" &&
                        "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/12 dark:text-blue-200"
                    )}
                    href="#service-details"
                    onClick={handleServiceDetailsClick}
                  >
                    {dict.servicesSection.detailTitle}
                  </a>
                </div>
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 border-b border-border pb-6 dark:border-white/10">
              <SectionKicker className="tracking-normal">
                {content.introLabel}
              </SectionKicker>
              <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600 sm:leading-7 dark:text-slate-300">
                {content.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            {filteredItems.length ? (
              <Accordion
                className="overflow-hidden rounded-lg border border-border bg-white shadow-sm dark:border-white/10 dark:bg-slate-950"
                collapsible
                onValueChange={handleOpenChange}
                type="single"
                value={openItem}
              >
                {filteredItems.map(({ index, item }) => {
                  const value = `faq-${index + 1}`
                  const question = formatFaqQuestion(item.question, index)

                  return (
                    <AccordionItem
                      className="scroll-mt-32 px-4 transition-colors data-[state=open]:bg-white/80 sm:px-5 dark:data-[state=open]:bg-white/[0.04]"
                      id={value}
                      key={`${value}-${item.question}`}
                      value={value}
                    >
                      <AccordionTrigger className="min-h-14 py-4 text-sm active:opacity-70 sm:text-base">
                        <span className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                            {index + 1}
                          </span>
                          <span>{question.replace(/^\d+\.\s*/, "")}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent
                        className="space-y-3 border-t border-border pt-4 pb-5 pl-9 leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300"
                      >
                        {item.answer.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 text-center dark:border-white/10">
                <Question
                  className="text-slate-400"
                  size={28}
                  weight="duotone"
                />
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {copy.empty}
                </p>
              </div>
            )}

            <ServiceDetailsSection embedded id="service-details" />
          </div>
        </div>
      </Section>
    </>
  )
}

function getInitialOpenItem(itemCount: number) {
  if (typeof window === "undefined") {
    return itemCount > 0 ? "faq-1" : undefined
  }

  const hashValue = window.location.hash.replace("#", "")
  const hashIndex = Number(hashValue.replace("faq-", ""))
  const isValidFaqHash =
    hashValue.startsWith("faq-") &&
    Number.isInteger(hashIndex) &&
    hashIndex >= 1 &&
    hashIndex <= itemCount

  return isValidFaqHash ? hashValue : itemCount > 0 ? "faq-1" : undefined
}

function getInitialActiveAnchor(itemCount: number) {
  if (typeof window !== "undefined") {
    const hashValue = window.location.hash.replace("#", "")

    if (hashValue === "service-details") return hashValue
  }

  return getInitialOpenItem(itemCount)
}

function formatFaqQuestion(question: string, index: number) {
  const text = question.replace(/^\s*\d+[.、]\s*/, "").trim()
  return `${index + 1}. ${text || "未命名问题"}`
}

export { FaqPage }
