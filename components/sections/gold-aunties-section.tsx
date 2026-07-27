import Image from "next/image"

import { Section, SectionHeading } from "@/components/common/section"
import { useI18n } from "@/lib/i18n"

const goldAuntieImages = Array.from(
  { length: 16 },
  (_, index) =>
    `/gold-aunties/gold-auntie-${String(index + 1).padStart(2, "0")}.png`
)
const goldAuntieRows = splitIntoRows(goldAuntieImages, 3)

type GoldAuntiesSectionProps = {
  id?: string
}

function GoldAuntiesSection({ id = "gold-aunties" }: GoldAuntiesSectionProps) {
  const { dict } = useI18n()

  return (
    <Section id={id} className="overflow-hidden py-8 sm:py-10">
      <SectionHeading
        kicker={dict.goldAunties.kicker}
        title={dict.goldAunties.title}
        description={dict.goldAunties.description}
        className="max-w-3xl"
      />

      <div className="relative mt-6 space-y-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/90 to-transparent sm:w-28 dark:from-slate-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/90 to-transparent sm:w-28 dark:from-slate-950" />
        {goldAuntieRows.map((row, index) => (
          <GoldAuntieMarquee
            key={row.startIndex}
            images={row.images}
            imageAlt={dict.goldAunties.imageAlt}
            reverse={index % 2 === 1}
            startIndex={row.startIndex}
          />
        ))}
      </div>
    </Section>
  )
}

function GoldAuntieMarquee({
  imageAlt,
  images,
  reverse = false,
  startIndex = 0,
}: {
  imageAlt: string
  images: string[]
  reverse?: boolean
  startIndex?: number
}) {
  return (
    <div className="overflow-hidden">
      <div
        className="gold-auntie-marquee flex w-max transform-gpu"
        data-reverse={reverse}
      >
        {[0, 1, 2, 3].map((groupIndex) => (
          <div
            aria-hidden={groupIndex > 0}
            className="flex shrink-0 gap-2.5 pr-2.5 sm:gap-3 sm:pr-3"
            key={groupIndex}
          >
            {images.map((src, index) => (
              <figure
                className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-blue-50 shadow-md shadow-blue-100/45 sm:w-28 lg:w-32 dark:bg-slate-900 dark:shadow-blue-950/25"
                key={`${groupIndex}-${src}`}
              >
                <Image
                  alt={`${imageAlt} ${startIndex + index + 1}`}
                  className="size-full object-cover"
                  height={320}
                  loading="lazy"
                  src={src}
                  sizes="(max-width: 640px) 80px, (max-width: 1024px) 112px, 128px"
                  width={256}
                />
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function splitIntoRows<T>(items: T[], rowCount: number) {
  const rowSize = Math.ceil(items.length / rowCount)

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const startIndex = rowIndex * rowSize

    return {
      images: items.slice(startIndex, startIndex + rowSize),
      startIndex,
    }
  }).filter((row) => row.images.length > 0)
}

export { GoldAuntiesSection }
