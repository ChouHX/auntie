import Image from "next/image"
import { useState } from "react"
import { PlayCircle, VideoCamera } from "@phosphor-icons/react"

import { Section, SectionHeading } from "@/components/common/section"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"

const serviceVideoIds = [
  "6a21VvDhnPY",
  "6a21VvDhnPY",
  "eTGvWFxVbok",
  "FscbmpAxLxU",
] as const

const serviceVideoCovers = [
  "/service-videos/regular.webp",
  "/service-videos/kitchen-deep.webp",
  "/service-videos/bathroom-scale.webp",
  "/service-videos/move-out-before-after.webp",
] as const

function ServiceVideoGallerySection() {
  const { dict } = useI18n()
  const gallery = dict.serviceVideoGallery
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null)
  const activeVideoId =
    activeVideoIndex === null ? null : serviceVideoIds[activeVideoIndex]
  const activeVideo =
    activeVideoIndex === null ? null : gallery.items[activeVideoIndex]

  return (
    <Section className="py-10 sm:py-20" id="service-videos">
      <SectionHeading
        kicker={gallery.kicker}
        title={gallery.title}
        description={gallery.description}
        className="max-w-2xl"
      />

      <div className="animate-fade-up-delay-1 relative mt-6 overflow-hidden sm:mt-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/85 to-transparent sm:w-28 dark:from-slate-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/85 to-transparent sm:w-28 dark:from-slate-950" />

        <div className="service-video-marquee flex w-max transform-gpu">
          {[0, 1].map((groupIndex) => (
            <div
              key={groupIndex}
              aria-hidden={groupIndex === 1}
              className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
            >
              {gallery.items.map((item, index) => (
                <ServiceVideoCard
                  key={`${groupIndex}-${item.title}-${serviceVideoIds[index]}`}
                  coverSrc={serviceVideoCovers[index] ?? serviceVideoCovers[0]}
                  description={item.description}
                  label={gallery.placeholder}
                  onOpen={() => setActiveVideoIndex(index)}
                  title={item.title}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={activeVideoIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveVideoIndex(null)
        }}
      >
        {activeVideoId && activeVideo ? (
          <DialogContent
            className="max-w-none gap-0 overflow-hidden border-0 bg-black p-0 text-white"
            style={{
              width:
                "min(calc(100vw - 1rem), calc((100dvh - 2rem) * 9 / 16), 430px)",
            }}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{activeVideo.title}</DialogTitle>
              <DialogDescription>{activeVideo.description}</DialogDescription>
            </DialogHeader>
            <div className="aspect-[9/16] w-full bg-black">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
                referrerPolicy="strict-origin-when-cross-origin"
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&playsinline=1`}
                title={activeVideo.title}
              />
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </Section>
  )
}

type ServiceVideoCardProps = {
  coverSrc: string
  description: string
  label: string
  onOpen: () => void
  title: string
}

function ServiceVideoCard({
  coverSrc,
  description,
  label,
  onOpen,
  title,
}: ServiceVideoCardProps) {
  return (
    <button
      aria-label={`${label}：${title}`}
      className="group relative aspect-[9/16] w-[min(62vw,220px)] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-slate-950 text-left text-white shadow-xl shadow-blue-100/45 sm:w-[240px] lg:w-[260px] dark:border-white/10 dark:shadow-blue-950/25"
      onClick={onOpen}
      type="button"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-cover transition duration-500 group-hover:scale-[1.025]"
        fill
        sizes="(max-width: 640px) 62vw, (max-width: 1024px) 240px, 260px"
        src={coverSrc}
      />
      <div className="absolute inset-0 bg-slate-950/10 transition group-hover:bg-slate-950/20" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950 via-slate-950/72 to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge className="border-white/15 bg-white/[0.12] text-white hover:bg-white/[0.16]">
            <VideoCamera size={14} weight="fill" />
            {label}
          </Badge>
          <div
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-white text-blue-700 shadow-lg shadow-blue-950/25 transition duration-300 group-hover:bg-blue-50 sm:size-11"
          >
            <PlayCircle size={26} weight="fill" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold sm:text-2xl">{title}</h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-blue-50/75 sm:mt-2 sm:text-sm sm:leading-6">
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

export { ServiceVideoGallerySection }
