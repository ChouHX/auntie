import { ArrowRight, CaretRight } from "@phosphor-icons/react"

import { Section } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"

function HomeAboutStorySection() {
  const { dict } = useI18n()
  const about = dict.aboutPage

  return (
    <Section id="about" className="py-8 sm:py-14">
      <Card className="overflow-hidden rounded-xl bg-card/86 shadow-lg shadow-blue-100/40 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] dark:bg-slate-900/82 dark:shadow-blue-950/25">
        <div className="relative min-h-[172px] overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 p-4 text-white sm:min-h-[360px] sm:p-6 lg:order-2 lg:min-h-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.20),transparent_30%),radial-gradient(circle_at_82%_80%,rgba(147,197,253,0.2),transparent_34%)]" />
          <div className="relative flex h-full min-h-[136px] flex-col items-center justify-center text-center sm:min-h-[300px]">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/12 shadow-xl ring-1 shadow-blue-950/35 ring-white/20 sm:size-18">
              <CaretRight className="size-7 sm:size-9" weight="fill" />
            </div>
            <h3 className="mt-3 text-lg font-semibold sm:mt-5 sm:text-2xl">
              {about.videoTitle}
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-5 text-blue-50/75 sm:mt-3 sm:text-sm sm:leading-7">
              {about.videoDescription}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-7 lg:order-1 lg:p-9">
          <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
            {about.sectionKicker}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:mt-3 sm:text-4xl dark:text-white">
            {about.imageCaption}
          </h2>
          <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:mt-5 sm:text-[15px] sm:leading-7 dark:text-slate-300">
            <p className="text-sm leading-6 font-medium text-slate-800 sm:text-base sm:leading-8 dark:text-slate-100">
              {about.storyIntro}
            </p>
            <p className="mt-2 line-clamp-3">{about.story[0]}</p>
            <p className="mt-2 hidden line-clamp-2 sm:block">
              {about.story[1]}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-blue-100 bg-blue-50/55 dark:border-white/10 dark:bg-white/[0.05]">
            {about.stats.map((stat) => (
              <div
                className="border-r border-blue-100 px-2 py-2.5 text-center last:border-r-0 dark:border-white/10"
                key={stat.label}
              >
                <div className="text-base font-semibold tracking-[-0.04em] text-blue-700 sm:text-2xl dark:text-blue-200">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-xs sm:leading-5 dark:text-slate-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-5 h-10 px-5" variant="brandStrong">
                {about.storyReadMore}
                <ArrowRight weight="bold" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-3xl gap-0 overflow-hidden rounded-lg p-0">
              <div className="border-b border-border bg-card px-5 pt-5 pb-4 sm:px-6 dark:border-white/10 dark:bg-slate-950">
                <DialogHeader className="pr-8">
                  <DialogTitle className="text-xl leading-tight tracking-[-0.03em] sm:text-2xl">
                    {about.storyDialogTitle}
                  </DialogTitle>
                  <DialogDescription className="pt-2 text-sm leading-6">
                    {about.sectionDescription}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain bg-background px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6 sm:text-[15px] sm:leading-8 dark:bg-slate-950 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {about.storyIntro}
                </p>
                <div className="mt-4 space-y-3">
                  {about.story.map((paragraph, index) => (
                    <div key={paragraph}>
                      {index === 4 ? (
                        <h3 className="pt-2 text-base font-semibold text-slate-950 dark:text-white">
                          {about.brandReasonTitle}
                        </h3>
                      ) : null}
                      <p>{paragraph}</p>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </Section>
  )
}

export { HomeAboutStorySection }
