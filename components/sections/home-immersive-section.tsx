import {
  ArrowRight,
  CalendarCheck,
  ChatCircleText,
  CheckCircle,
  Clock,
  HouseLine,
  ListChecks,
  PhoneCall,
  SealCheck,
  ShieldCheck,
  Sparkle,
  Warning,
  XCircle,
} from "@phosphor-icons/react"
import { useState } from "react"

import { BrandComparisonTable } from "@/components/sections/brand-comparison-section"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { highlights } from "@/data/site"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type SceneKind = "comparison" | "process" | "standards"

type SceneDialogState = {
  description: string
  kind: SceneKind
  title: string
}

const sceneKinds = ["comparison", "standards", "process"] as const

const sceneVisuals = [
  {
    accent: "text-blue-700 dark:text-blue-200",
    icon: ShieldCheck,
    image: "/about_us.png",
    metricKey: "scopeMetric",
    position: "50% 52%",
    ring: "ring-blue-200 dark:ring-blue-300/30",
  },
  {
    accent: "text-emerald-700 dark:text-emerald-200",
    icon: SealCheck,
    image: "/services/regular.jpg",
    metricKey: "standardMetric",
    position: "50% 42%",
    ring: "ring-emerald-200 dark:ring-emerald-300/30",
  },
  {
    accent: "text-amber-700 dark:text-amber-200",
    icon: ListChecks,
    image: "/services/move-out.jpg",
    metricKey: "supportMetric",
    position: "54% 42%",
    ring: "ring-amber-200 dark:ring-amber-300/30",
  },
] as const

const processIcons = [
  ChatCircleText,
  CalendarCheck,
  Clock,
  PhoneCall,
  HouseLine,
  CheckCircle,
] as const

function HomeImmersiveSection() {
  const { dict } = useI18n()
  const experience = dict.homeExperience
  const [activeDialog, setActiveDialog] = useState<SceneDialogState | null>(
    null
  )

  return (
    <section
      data-gsap-story
      data-scroll-reveal="false"
      className="relative scroll-mt-28 overflow-x-clip bg-[linear-gradient(180deg,#f8fbff_0%,#edf7ff_48%,#ffffff_100%)] text-slate-950 sm:scroll-mt-24 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)] dark:text-white"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(37,99,235,0.045)_1px,transparent_1px)] bg-[size:64px_64px] opacity-70 dark:opacity-18" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-white/20" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent dark:via-white/16" />

      <div
        data-gsap-story-pin
        className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-18 md:min-h-[calc(100svh-72px)] md:py-0 lg:px-8"
      >
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] md:items-center md:gap-10 lg:gap-14">
          <div className="md:flex md:min-h-[min(76svh,820px)] md:flex-col md:justify-center">
            <div
              data-gsap-reveal
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/74 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase shadow-sm shadow-blue-100/45 dark:border-white/10 dark:bg-white/[0.06] dark:text-blue-100 dark:shadow-none"
            >
              <Sparkle size={14} weight="fill" />
              {experience.kicker}
            </div>
            <h2
              data-gsap-reveal
              data-gsap-y="38"
              className="mt-4 max-w-xl text-3xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance text-slate-950 sm:text-5xl dark:text-white"
            >
              {experience.title}
            </h2>
            <p
              data-gsap-reveal
              data-gsap-y="28"
              className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-300"
            >
              {experience.description}
            </p>

            <div className="mt-8 hidden gap-3 md:grid">
              {experience.scenes.map((scene, index) => (
                <SceneStep
                  key={scene.title}
                  cta={scene.cta}
                  description={scene.text}
                  index={index}
                  onOpen={() =>
                    setActiveDialog({
                      description: experience.dialogDescription,
                      kind: sceneKinds[index] ?? "comparison",
                      title: scene.dialogTitle,
                    })
                  }
                  title={scene.title}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-0 md:h-[min(76svh,820px)] md:min-h-[620px] md:[perspective:1400px]">
            <div className="grid gap-3 md:block md:size-full">
              {experience.scenes.map((scene, index) => {
                const visual = sceneVisuals[index] ?? sceneVisuals[0]
                const IconComponent = visual.icon

                return (
                  <article
                    data-gsap-story-card
                    key={scene.title}
                    className="relative overflow-hidden rounded-lg bg-slate-950 shadow-2xl shadow-blue-950/18 md:absolute md:inset-0 dark:shadow-black/30"
                  >
                    <img
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 size-full object-cover opacity-100 brightness-[1.03] contrast-[1.04] saturate-[1.04] dark:brightness-[0.98] dark:contrast-[1.03] dark:saturate-100"
                      loading={index === 0 ? "eager" : "lazy"}
                      src={visual.image}
                      style={{ objectPosition: visual.position }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.18)_42%,rgba(2,6,23,0)_100%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.06)_0%,rgba(2,6,23,0.08)_44%,rgba(2,6,23,0.78)_100%)]" />

                    <div className="relative flex min-h-[410px] flex-col justify-between p-5 sm:min-h-[470px] sm:p-7 md:min-h-full md:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.42)]">
                          <IconComponent
                            className="size-7 text-white/88"
                            weight="duotone"
                          />
                          <span className="text-xs font-semibold tracking-[0.18em] text-white/72 uppercase">
                            {scene.eyebrow}
                          </span>
                        </div>
                        <div className="text-right drop-shadow-[0_8px_18px_rgba(0,0,0,0.42)]">
                          <div className="text-[10px] font-semibold tracking-[0.18em] text-white/58 uppercase">
                            {experience.sceneLabel}
                          </div>
                          <div className="mt-0.5 text-sm font-semibold text-white">
                            {experience[visual.metricKey]}
                          </div>
                        </div>
                      </div>

                      <div className="max-w-[34rem] pb-0 text-white sm:pb-1 md:pb-2">
                        <h3 className="max-w-xl text-3xl leading-tight font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                          {scene.title}
                        </h3>
                        <p className="mt-4 max-w-lg text-sm leading-7 text-white/82 sm:text-base sm:leading-8">
                          {scene.text}
                        </p>

                        <Button
                          className="mt-5 h-10 px-4 md:hidden"
                          onClick={() =>
                            setActiveDialog({
                              description: experience.dialogDescription,
                              kind: sceneKinds[index] ?? "comparison",
                              title: scene.dialogTitle,
                            })
                          }
                          size="sm"
                          type="button"
                          variant="heroSecondary"
                        >
                          {scene.cta}
                          <ArrowRight weight="bold" />
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <SceneDetailDialog
        dialog={activeDialog}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDialog(null)
          }
        }}
      />
    </section>
  )
}

type SceneStepProps = {
  cta: string
  description: string
  index: number
  onOpen: () => void
  title: string
}

function SceneStep({
  cta,
  description,
  index,
  onOpen,
  title,
}: SceneStepProps) {
  return (
    <div
      data-gsap-story-step
      className="rounded-lg border border-blue-100 bg-white/78 p-4 shadow-lg shadow-blue-950/8 dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/10"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0">
          <h3 className="text-base leading-tight font-semibold text-slate-950 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
          <button
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-950 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:text-blue-200 dark:hover:text-white dark:focus-visible:ring-blue-200"
            onClick={onOpen}
            type="button"
          >
            {cta}
            <ArrowRight size={15} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}

type SceneDetailDialogProps = {
  dialog: SceneDialogState | null
  onOpenChange: (open: boolean) => void
}

function SceneDetailDialog({ dialog, onOpenChange }: SceneDetailDialogProps) {
  return (
    <Dialog open={Boolean(dialog)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1rem)] max-w-5xl gap-0 overflow-hidden rounded-lg border-white/10 p-0 shadow-2xl sm:w-[calc(100%-2rem)]">
        <div className="border-b border-border bg-card px-5 pt-5 pb-4 sm:px-6 dark:border-white/10 dark:bg-slate-950">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl leading-tight tracking-[-0.03em] sm:text-2xl">
              {dialog?.title ?? ""}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6">
              {dialog?.description ?? ""}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain bg-background p-4 sm:p-6 dark:bg-slate-950">
          <SceneDialogBody kind={dialog?.kind ?? "comparison"} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SceneDialogBody({ kind }: { kind: SceneKind }) {
  const { dict } = useI18n()

  if (kind === "comparison") {
    return <ResponsiveComparisonDetails />
  }

  if (kind === "standards") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map(({ icon: IconComponent }, index) => {
          const item = dict.why.items[index]
          if (!item) return null

          return (
            <article
              className="rounded-lg border border-border bg-card p-4 dark:border-white/10 dark:bg-white/[0.05]"
              key={item.title}
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                <IconComponent className="size-6" weight="duotone" />
              </div>
              <h3 className="mt-3 text-base leading-snug font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.text}
              </p>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {dict.processSection.steps.map((step, index) => {
        const IconComponent = processIcons[index] ?? CheckCircle

        return (
          <article
            className="rounded-lg border border-border bg-card p-4 dark:border-white/10 dark:bg-white/[0.05]"
            key={step.title}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white dark:bg-blue-600">
                <IconComponent className="size-5" weight="fill" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 dark:text-blue-200">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-1 text-base leading-snug font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ResponsiveComparisonDetails() {
  const { dict } = useI18n()
  const comparison = dict.brandComparison

  return (
    <>
      <div className="sm:hidden">
        <div className="grid gap-2.5">
          {comparison.rows.map((row) => (
            <article
              className="rounded-lg border border-border bg-card p-3 dark:border-white/10 dark:bg-white/[0.05]"
              key={row.feature}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm leading-snug font-semibold text-foreground">
                  {row.feature}
                </h3>
                <MobileComparisonStatus
                  featured
                  featuredLabel={comparison.brandColumn}
                  status={row.values[0]}
                />
              </div>
              <div className="mt-3 grid gap-1.5">
                {comparison.competitorColumns.map((column, index) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md bg-muted/55 px-2.5 py-2"
                    key={column}
                  >
                    <span className="min-w-0 text-xs leading-4 text-muted-foreground">
                      {column}
                    </span>
                    <MobileComparisonStatus status={row.values[index + 1]} />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="hidden sm:block">
        <BrandComparisonTable className="shadow-none" />
      </div>
    </>
  )
}

function MobileComparisonStatus({
  featured = false,
  featuredLabel,
  status,
}: {
  featured?: boolean
  featuredLabel?: string
  status: string
}) {
  if (status === "good") {
    return (
      <span
        aria-label="Yes"
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full text-emerald-600 dark:text-emerald-300",
          featured
            ? "bg-emerald-50 px-2 py-1 text-xs font-semibold dark:bg-emerald-500/10"
            : "text-sm"
        )}
      >
        <CheckCircle size={featured ? 15 : 16} weight="fill" />
        {featured ? featuredLabel : null}
      </span>
    )
  }

  if (status === "warn") {
    return (
      <span
        aria-label="Limited"
        className="inline-flex shrink-0 items-center text-amber-500 dark:text-amber-300"
      >
        <Warning size={16} weight="fill" />
      </span>
    )
  }

  if (status === "bad") {
    return (
      <span
        aria-label="No"
        className="inline-flex shrink-0 items-center text-red-500"
      >
        <XCircle size={16} weight="fill" />
      </span>
    )
  }

  return <span aria-label="Not applicable" className="size-4 shrink-0" />
}

export { HomeImmersiveSection }
