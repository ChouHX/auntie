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
  const { content: cmsContent } = useCmsContent(["afterSalesPage"])
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
        description={content.heroDescription}
        kicker={content.kicker}
        title={content.heroTitle}
      />

      <Section className="py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12">
          <main className="min-w-0">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white shadow-lg shadow-blue-950/15">
                <ShieldCheck size={23} weight="bold" />
              </div>
              <div>
                <h2 className="text-2xl leading-tight font-semibold text-slate-950 dark:text-white">
                  {content.introTitle}
                </h2>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-300">
                  {content.intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-md bg-blue-50 px-3 text-sm font-semibold text-blue-700 dark:bg-blue-500/12 dark:text-blue-200">
                  <Clock size={17} weight="bold" />
                  {content.responseMeta}
                </div>
              </div>
            </div>

            <div className="mt-10 grid border-y border-border md:grid-cols-2 dark:border-white/10">
              <section className="py-7 md:pr-8">
                <div className="flex items-center gap-3">
                  <CheckCircle
                    className="text-blue-700 dark:text-blue-200"
                    size={22}
                    weight="bold"
                  />
                  <h2 className="text-xl font-semibold">
                    {content.supportTitle}
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {content.supportDescription}
                </p>
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {content.supportItems.map((item) => (
                    <li className="flex gap-2.5" key={item}>
                      <CheckCircle
                        className="mt-1 shrink-0 text-blue-700 dark:text-blue-200"
                        size={16}
                        weight="fill"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-t border-border py-7 md:border-t-0 md:border-l md:pl-8 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <ChatCircleText
                    className="text-blue-700 dark:text-blue-200"
                    size={22}
                    weight="bold"
                  />
                  <h2 className="text-xl font-semibold">
                    {content.feedbackTitle}
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {content.feedbackDescription}
                </p>
                <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {content.feedbackBody.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            </div>
          </main>

          <aside className="order-first lg:sticky lg:top-24 lg:order-last">
            <Card className="rounded-lg border-white/60 bg-white/78 p-5 shadow-xl shadow-slate-950/7 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/78">
              <SectionKicker className="tracking-normal">
                {content.qrTitle}
              </SectionKicker>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {content.qrDescription}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-1">
                {qrItems.map((item) => (
                  <figure className="min-w-0" key={item.id}>
                    <img
                      alt={`${item.label} QR code`}
                      className="mx-auto aspect-square w-full max-w-52 rounded-lg bg-white object-contain p-2 ring-1 ring-slate-200 dark:ring-white/10"
                      loading="eager"
                      src={item.src}
                    />
                    <figcaption className="mt-2 text-center text-xs font-semibold text-slate-800 sm:text-sm dark:text-slate-100">
                      {item.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
                <Clock className="shrink-0" size={16} weight="bold" />
                {content.responseMeta}
              </div>
            </Card>
          </aside>
        </div>
      </Section>

      <Section className="border-t border-border bg-white/50 py-14 sm:py-20 dark:border-white/10 dark:bg-white/[0.025]">
        <article className="mx-auto max-w-3xl">
          <SectionKicker className="tracking-normal">
            {content.storyKicker}
          </SectionKicker>
          <h2 className="mt-3 text-2xl leading-tight font-semibold text-balance text-slate-950 sm:text-4xl dark:text-white">
            {content.storyTitle}
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-300">
            {content.story.map((paragraph, index) => (
              <p
                className={
                  index === 4 || index === 5 || index === 12
                    ? "font-semibold text-slate-900 dark:text-white"
                    : undefined
                }
                key={paragraph}
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
