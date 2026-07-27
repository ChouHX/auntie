import {
  ChatCircleText,
  CheckCircle,
  Clock,
  ShieldCheck,
} from "@phosphor-icons/react"

import { PageHero } from "@/components/common/page-hero"
import { Section, SectionKicker } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { defaultAfterSalesPage } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"

function AfterSalesPage() {
  const { dict, language } = useI18n()
  const { content: cmsContent } = useCmsContent()
  const content = dict.afterSalesPage
  const settings =
    cmsContent.afterSalesPage?.[language] ?? defaultAfterSalesPage[language]
  const qrItems = defaultAfterSalesPage[language].qrItems.map(
    (defaultQrItem, index) => ({
      ...defaultQrItem,
      ...(settings.qrItems[index] ?? {}),
      src: settings.qrItems[index]?.src || defaultQrItem.src,
    })
  )

  return (
    <>
      <PageHero
        kicker={content.kicker}
        title={content.heroTitle}
        description={content.heroDescription}
      />
      <Section className="py-6 sm:py-16">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5 sm:space-y-6">
            {/* Intro card */}
            <Card className="rounded-xl bg-card/84 p-4 shadow-lg shadow-blue-100/40 sm:p-7 sm:shadow-xl sm:shadow-blue-100/45 dark:bg-slate-900/82 dark:shadow-blue-950/25">
              <div className="flex items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg shadow-blue-100/70 sm:size-11 dark:bg-blue-500 dark:shadow-none">
                      <ShieldCheck
                        className="size-5 sm:size-[22px]"
                        weight="bold"
                      />
                    </div>
                    <h2 className="text-lg font-semibold tracking-[-0.035em] text-slate-950 sm:text-2xl dark:text-white">
                      {content.introTitle}
                    </h2>
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600 sm:mt-4 sm:space-y-2.5 sm:text-base sm:leading-8 dark:text-slate-300">
                    {content.intro.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 sm:mt-4 sm:text-sm dark:border-blue-300/20 dark:bg-blue-400/10 dark:text-blue-200">
                    <Clock size={16} weight="bold" />
                    {content.responseMeta}
                  </div>
                </div>
              </div>
            </Card>

            {/* Support + Feedback: 2-col on mobile, same on desktop */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <Card className="rounded-xl bg-card/84 p-4 shadow-lg shadow-blue-100/35 sm:p-6 dark:bg-slate-900/82 dark:shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
                    <CheckCircle size={21} weight="bold" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-[-0.025em] sm:text-xl">
                    {content.supportTitle}
                  </h2>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7 dark:text-slate-300">
                  {content.supportDescription}
                </p>
                <ul className="mt-4 space-y-2 text-xs leading-5 text-slate-700 sm:mt-5 sm:space-y-3 sm:text-sm sm:leading-6 dark:text-slate-200">
                  {content.supportItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle
                        className="mt-0.5 size-4 shrink-0 text-blue-700 dark:text-blue-200"
                        weight="bold"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="rounded-xl bg-card/84 p-4 shadow-lg shadow-blue-100/35 sm:p-6 dark:bg-slate-900/82 dark:shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
                    <ChatCircleText size={21} weight="bold" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-[-0.025em] sm:text-xl">
                    {content.feedbackTitle}
                  </h2>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7 dark:text-slate-300">
                  {content.feedbackDescription}
                </p>
                <div className="mt-4 space-y-2 text-xs leading-6 text-slate-600 sm:mt-5 sm:space-y-3 sm:text-sm sm:leading-7 dark:text-slate-300">
                  {content.feedbackBody.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* QR sidebar: compact on mobile */}
          <aside className="flex lg:pt-1">
            <Card className="flex w-full flex-col items-center rounded-xl bg-card/88 p-4 text-center shadow-lg shadow-blue-100/40 sm:p-5 sm:shadow-xl sm:shadow-blue-100/50 lg:min-h-full dark:bg-slate-900/88 dark:shadow-blue-950/25">
              <div className="max-w-xs">
                <SectionKicker>{content.qrTitle}</SectionKicker>
                <p className="mt-2 text-xs leading-6 text-slate-600 sm:mt-3 sm:text-sm sm:leading-7 dark:text-slate-300">
                  {content.qrDescription}
                </p>
              </div>
              <div className="mt-5 flex w-full flex-col items-center gap-5 sm:mt-6 sm:gap-7">
                {qrItems.map((item) => (
                  <figure
                    className="flex w-full flex-col items-center text-center"
                    key={item.id}
                  >
                    <img
                      alt={`${item.label} QR code`}
                      className="size-36 rounded-lg object-contain sm:size-52"
                      loading="lazy"
                      src={item.src}
                    />
                    <figcaption className="mt-2.5 text-xs font-semibold text-slate-800 sm:mt-3 sm:text-sm dark:text-slate-100">
                      {item.label}
                      <p className="mt-1 text-xs leading-5 font-normal text-slate-500 dark:text-slate-400">
                        {content.qrTitle}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-5 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {content.qrDescription}
              </p>
            </Card>
          </aside>
        </div>
      </Section>

      <Section className="pt-0 pb-8 sm:pt-0 sm:pb-16">
        <article className="mx-auto max-w-4xl">
          <SectionKicker>{content.storyKicker}</SectionKicker>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-balance text-slate-950 sm:mt-4 sm:text-4xl dark:text-white">
            {content.storyTitle}
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600 sm:mt-7 sm:text-base sm:leading-8 dark:text-slate-300">
            {content.story.map((paragraph, index) => (
              <p
                key={paragraph}
                className={
                  index === 4 || index === 5 || index === 12
                    ? "font-semibold text-slate-900 dark:text-white"
                    : undefined
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </Section>
    </>
  )
}

export { AfterSalesPage }
