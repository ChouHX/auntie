import { PlayCircle, VideoCamera } from "@phosphor-icons/react"

import { Section, SectionHeading } from "@/components/common/section"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

function ServiceVideoGallerySection() {
  const { dict } = useI18n()
  const gallery = dict.serviceVideoGallery

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
              {gallery.items.map((item) => (
                <VideoPlaceholder
                  key={`${groupIndex}-${item.title}`}
                  description={item.description}
                  label={gallery.placeholder}
                  title={item.title}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

type VideoPlaceholderProps = {
  description: string
  label: string
  title: string
}

function VideoPlaceholder({
  description,
  label,
  title,
}: VideoPlaceholderProps) {
  return (
    <div className="group relative aspect-video w-[min(78vw,320px)] shrink-0 overflow-hidden rounded-xl border border-border bg-slate-950 text-white shadow-xl shadow-blue-100/45 sm:w-[380px] lg:w-[420px] dark:border-white/10 dark:shadow-blue-950/25">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(36,94,244,0.64),rgba(15,23,42,0.92)_42%,rgba(8,47,73,0.82))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.2),transparent_30%),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px] opacity-80" />
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
    </div>
  )
}

export { ServiceVideoGallerySection }
