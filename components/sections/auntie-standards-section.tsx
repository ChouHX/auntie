import { CheckCircle } from "@phosphor-icons/react"

import { SectionKicker } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const desktopStepPositions = [
  {
    bubble: "left-1/2 top-[132px] -translate-x-1/2",
    card: "left-1/2 top-0 w-[360px] -translate-x-1/2 text-center",
  },
  {
    bubble: "right-[120px] top-[250px]",
    card: "right-0 top-[96px] w-[330px] text-left",
  },
  {
    bubble: "right-[232px] bottom-[106px]",
    card: "right-[40px] bottom-0 w-[360px] text-left",
  },
  {
    bubble: "left-[232px] bottom-[106px]",
    card: "left-[52px] bottom-0 w-[360px] text-left",
  },
  {
    bubble: "left-[112px] top-[250px]",
    card: "left-0 top-[106px] w-[330px] text-left",
  },
] as const

type AuntieStandardsSectionProps = {
  id?: string
  showIntro?: boolean
  showProcess?: boolean
  showVideo?: boolean
}

function AuntieStandardsSection({
  id,
  showIntro = true,
  showProcess = true,
  showVideo = true,
}: AuntieStandardsSectionProps) {
  const { dict } = useI18n()
  const standards = dict.auntieStandards

  return (
    <section
      id={id}
      className="relative scroll-mt-24 overflow-hidden py-16 text-slate-950 sm:py-20 dark:text-white"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showIntro ? (
          <div className="mx-auto max-w-3xl text-center">
            <SectionKicker>{standards.kicker}</SectionKicker>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
              {standards.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              {standards.lead}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {standards.description}
            </p>
          </div>
        ) : null}

        {showVideo ? (
          <div
            className={cn("mx-auto max-w-5xl", showIntro ? "mt-10" : "mt-0")}
          >
            <div className="mb-5 flex items-end justify-between gap-4">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl dark:text-white">
                {standards.videoTitle}
              </h3>
              <div className="hidden h-px flex-1 bg-blue-200/80 sm:block dark:bg-white/10" />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-950 shadow-2xl shadow-blue-200/55 dark:shadow-blue-950/35">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.32),rgba(14,165,233,0.12)),linear-gradient(180deg,rgba(15,23,42,0.42),rgba(15,23,42,0.86))]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:52px_52px] opacity-35" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-white text-blue-700 shadow-2xl shadow-slate-950/25">
                  <span className="ml-1 h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-blue-700" />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showProcess ? (
          <>
            <div className="relative mx-auto mt-12 hidden min-h-[660px] max-w-6xl lg:block">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[8%] top-[118px] h-[430px] w-[84%] text-cyan-500/80 dark:text-blue-300/50"
                preserveAspectRatio="none"
                viewBox="0 0 1000 430"
              >
                <defs>
                  <marker
                    id="auntie-flow-arrow"
                    markerHeight="10"
                    markerWidth="10"
                    orient="auto"
                    refX="8"
                    refY="5"
                  >
                    <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
                  </marker>
                </defs>
                <path
                  d="M500 44 L842 178 L742 354 L258 354 L158 178 L500 44"
                  fill="none"
                  markerEnd="url(#auntie-flow-arrow)"
                  stroke="currentColor"
                  strokeDasharray="8 14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
              </svg>

              <div className="absolute top-[228px] left-1/2 w-[460px] -translate-x-1/2">
                <div className="overflow-hidden p-7 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200/80 dark:shadow-none">
                    <CheckCircle size={30} weight="fill" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                    {standards.centerTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {standards.centerText}
                  </p>
                </div>
              </div>

              {standards.steps.map((step, index) => {
                const position =
                  desktopStepPositions[index] ?? desktopStepPositions[0]

                return (
                  <div key={step.title}>
                    <div
                      className={cn(
                        "absolute z-20 flex size-20 items-center justify-center rounded-full bg-blue-500/18 ring-1 ring-blue-300/60 dark:bg-blue-500/16 dark:ring-blue-300/30",
                        position.bubble
                      )}
                    >
                      <div className="flex size-16 flex-col items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200/70 dark:shadow-blue-950/40">
                        <span className="text-xl leading-none font-semibold">
                          {index + 1}
                        </span>
                        <span className="mt-1 text-[10px] font-semibold">
                          {standards.stepLabel} {index + 1}
                        </span>
                      </div>
                    </div>
                    <article
                      className={cn(
                        "absolute rounded-xl px-2 text-sm leading-7 text-slate-600 dark:text-slate-300",
                        position.card
                      )}
                    >
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2">{step.text}</p>
                    </article>
                  </div>
                )
              })}
            </div>

            <div className="mt-10 grid gap-3 lg:hidden">
              {standards.steps.map((step, index) => {
                return (
                  <article
                    key={step.title}
                    className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 rounded-xl border border-blue-100/80 bg-white/88 p-4 shadow-lg shadow-blue-100/35 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200/70 dark:shadow-none">
                      <span className="text-sm font-semibold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-[0.16em] text-blue-700 uppercase dark:text-blue-200">
                        {standards.stepLabel} {index + 1}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {step.text}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mx-auto mt-8 grid max-w-5xl gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
              <Card className="rounded-xl border-blue-100/80 bg-white/88 p-5 shadow-lg shadow-blue-100/35 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
                  {standards.processLabel}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {standards.processText}
                </p>
              </Card>
              <Card className="rounded-xl border-blue-100/80 bg-white/88 p-5 shadow-lg shadow-blue-100/35 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
                  {standards.principleTitle}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {standards.principleText}
                </p>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

export { AuntieStandardsSection }
