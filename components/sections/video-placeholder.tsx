import { CaretRight } from "@phosphor-icons/react"

import { Section, SectionHeading } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"

function VideoPlaceholder() {
  const { dict } = useI18n()
  const about = dict.aboutPage

  return (
    <Section>
      <Card className="grid overflow-hidden rounded-2xl shadow-xl shadow-blue-100/60 lg:grid-cols-[0.95fr_1.05fr] dark:shadow-blue-950/25">
        <div className="p-8 sm:p-12">
          <SectionHeading
            kicker={about.videoKicker}
            title={about.videoTitle}
            titleClassName="text-4xl"
            description={about.videoDescription}
          />
        </div>
        <div className="relative flex min-h-80 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 p-8">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10 opacity-40" />
          <div className="absolute -bottom-24 -left-12 size-64 rounded-full bg-blue-300/20 opacity-40" />
          <div className="text-center text-white">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-white/10 shadow-2xl shadow-blue-950/40">
              <CaretRight size={36} weight="fill" />
            </div>
            <div className="mt-5 text-xl font-semibold">
              {about.videoPlaceholder}
            </div>
            <div className="mt-2 text-sm text-white/55">{about.videoMeta}</div>
          </div>
        </div>
      </Card>
    </Section>
  )
}

export { VideoPlaceholder }
