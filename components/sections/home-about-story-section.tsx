import Image from "next/image"
import { useState } from "react"
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
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  return (
    <Section id="about" className="py-8 sm:py-14">
      <Card className="overflow-hidden rounded-xl bg-card/86 shadow-lg shadow-blue-100/40 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center dark:bg-slate-900/82 dark:shadow-blue-950/25">
        <button
          aria-label={about.videoTitle}
          className="group relative block aspect-video w-full cursor-pointer overflow-hidden bg-slate-950 text-white lg:order-2"
          onClick={() => setIsVideoOpen(true)}
          type="button"
        >
          <Image
            alt={about.videoTitle}
            className="object-contain transition duration-500 group-hover:scale-[1.015]"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            src="/brand-story-cover.webp"
          />
          <span className="absolute inset-0 bg-slate-950/5 transition group-hover:bg-slate-950/15" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-blue-700/92 shadow-2xl ring-1 shadow-slate-950/40 ring-white/70 transition group-hover:scale-105 sm:size-16">
              <CaretRight className="ml-0.5 size-7 sm:size-9" weight="fill" />
            </span>
          </span>
        </button>

        <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
          {isVideoOpen ? (
            <DialogContent className="w-[calc(100%-1rem)] max-w-5xl gap-0 overflow-hidden border-0 bg-black p-0 text-white sm:w-[calc(100%-2rem)]">
              <DialogHeader className="sr-only">
                <DialogTitle>{about.videoTitle}</DialogTitle>
                <DialogDescription>{about.videoDescription}</DialogDescription>
              </DialogHeader>
              <div className="aspect-video w-full bg-black">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full border-0"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src="https://www.youtube-nocookie.com/embed/U1lwglk606w?autoplay=1&rel=0"
                  title={about.videoTitle}
                />
              </div>
            </DialogContent>
          ) : null}
        </Dialog>

        <div className="p-4 sm:p-6 lg:order-1 lg:p-7">
          <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
            {about.sectionKicker}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:mt-3 sm:text-3xl dark:text-white">
            {about.imageCaption}
          </h2>
          <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:mt-4 sm:text-[15px] sm:leading-7 dark:text-slate-300">
            <p className="text-sm leading-6 font-medium text-slate-800 sm:text-base sm:leading-8 dark:text-slate-100">
              {about.storyIntro}
            </p>
            <p className="mt-2 line-clamp-2">{about.story[0]}</p>
          </div>

          <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-blue-100 bg-blue-50/55 dark:border-white/10 dark:bg-white/[0.05]">
            {about.stats.map((stat) => (
              <div
                className="border-r border-blue-100 px-2 py-2 text-center last:border-r-0 dark:border-white/10"
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
              <Button className="mt-4 h-10 px-5" variant="brandStrong">
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
