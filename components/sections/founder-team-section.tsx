import Image from "next/image"

import { Section, SectionHeading } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"

const founderImages = [
  { src: "/founders/founder-will.webp", position: "50% 22%" },
  { src: "/founders/founder-isaac.webp", position: "50% 18%" },
  { src: "/founders/founder-fan.webp", position: "50% 18%" },
] as const

function FounderTeamSection() {
  const { dict } = useI18n()
  const founders = dict.founderTeam.members

  return (
    <Section id="team" className="py-8 sm:py-10">
      <SectionHeading
        kicker={dict.founderTeam.kicker}
        title={dict.founderTeam.title}
        description={dict.founderTeam.description}
        className="max-w-3xl"
        descriptionClassName="max-sm:line-clamp-2"
      />

      <div className="mt-5 grid gap-2.5 sm:mt-6 sm:gap-3 md:grid-cols-3">
        {founders.map((founder, index) => (
          <Card
            className="animate-fade-up grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 rounded-xl bg-card/86 p-3 text-left shadow-md shadow-blue-100/35 sm:flex sm:flex-col sm:items-center sm:p-4 sm:text-center dark:bg-white/[0.06] dark:shadow-none"
            key={founder.name}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="relative size-24 shrink-0 rounded-full bg-white p-1 shadow-sm ring-1 ring-blue-100 sm:size-44 sm:p-1.5 lg:size-48 dark:bg-slate-950 dark:ring-white/10">
              <Image
                alt={`${founder.name} ${founder.role}`}
                className="size-full rounded-full object-cover"
                decoding="async"
                draggable={false}
                height={384}
                loading="lazy"
                src={(founderImages[index] ?? founderImages[0]).src}
                sizes="(max-width: 640px) 96px, (max-width: 1024px) 176px, 192px"
                style={{
                  imageRendering: "auto",
                  objectPosition: (founderImages[index] ?? founderImages[0])
                    .position,
                }}
                width={384}
              />
            </div>
            <div className="min-w-0 sm:mt-4">
              <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1 sm:justify-center">
                <h3 className="text-base leading-tight font-semibold tracking-[-0.03em] text-slate-950 sm:text-lg dark:text-white">
                  {founder.name}
                </h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary dark:bg-blue-400/10 dark:text-blue-200">
                  {founder.role}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 font-medium text-blue-700 sm:text-sm dark:text-blue-200">
                {founder.title}
              </p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600 sm:mt-2 sm:line-clamp-3 sm:text-sm sm:leading-6 dark:text-slate-300">
                {founder.text}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}

export { FounderTeamSection }
