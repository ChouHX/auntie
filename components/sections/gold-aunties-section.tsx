import { useEffect, useState } from "react"
import { Star } from "@phosphor-icons/react"
import { Section, SectionHeading } from "@/components/common/section"
import { fetchFeaturedAunties } from "@/lib/cms-api"
import { useI18n } from "@/lib/i18n"
import type { CmsTeamMember } from "@/types/cms"

const fallbackImages = Array.from(
  { length: 16 },
  (_, index) =>
    `/gold-aunties/gold-auntie-${String(index + 1).padStart(2, "0")}-thumb.webp`
)

function GoldAuntiesSection() {
  const { dict } = useI18n()
  const [topAunties, setTopAunties] = useState<CmsTeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    fetchFeaturedAunties()
      .then((aunties) => {
        if (isMounted) {
          setTopAunties(aunties)
        }
      })
      .catch(() => {
        if (isMounted) {
          setTopAunties([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const useCmsData = topAunties.length > 0 && !isLoading

  return (
    <Section id="gold-aunties" className="overflow-hidden py-8 sm:py-10">
      <SectionHeading
        kicker={dict.goldAunties.kicker}
        title={dict.goldAunties.title}
        description={dict.goldAunties.description}
        className="max-w-3xl"
      />

      <div className="group/marquee relative mt-6 space-y-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/90 to-transparent sm:w-28 dark:from-slate-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/90 to-transparent sm:w-28 dark:from-slate-950" />

        {useCmsData ? (
          <>
            <GoldAuntieCardMarquee
              aunties={topAunties.slice(0, 6)}
              imageAlt={dict.goldAunties.imageAlt}
            />
            <GoldAuntieCardMarquee
              aunties={topAunties.slice(6)}
              imageAlt={dict.goldAunties.imageAlt}
              reverse
              startIndex={6}
            />
          </>
        ) : (
          <>
            <GoldAuntieImageMarquee
              images={fallbackImages.slice(0, 8)}
              imageAlt={dict.goldAunties.imageAlt}
            />
            <GoldAuntieImageMarquee
              images={fallbackImages.slice(8)}
              imageAlt={dict.goldAunties.imageAlt}
              reverse
              startIndex={8}
            />
          </>
        )}
      </div>
    </Section>
  )
}

function GoldAuntieCardMarquee({
  aunties,
  imageAlt,
  reverse = false,
  startIndex = 0,
}: {
  aunties: CmsTeamMember[]
  imageAlt: string
  reverse?: boolean
  startIndex?: number
}) {
  if (aunties.length === 0) return null

  return (
    <div className="overflow-hidden">
      <div
        className="gold-auntie-marquee flex w-max"
        data-reverse={reverse}
      >
        {[0, 1, 2, 3].map((groupIndex) => (
          <div
            aria-hidden={groupIndex > 0}
            className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
            key={groupIndex}
          >
            {aunties.map((auntie, index) => (
              <AuntieCard
                key={`${groupIndex}-${auntie.id}`}
                auntie={auntie}
                imageAlt={`${imageAlt} ${startIndex + index + 1}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function AuntieCard({
  auntie,
  imageAlt,
}: {
  auntie: CmsTeamMember
  imageAlt: string
}) {
  const avatarSrc = auntie.avatarThumb ?? auntie.avatar

  return (
    <figure className="gold-auntie-card relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-indigo-50 to-blue-50 shadow-md shadow-indigo-100/45 sm:w-36 lg:w-40 dark:from-slate-800 dark:to-slate-900 dark:shadow-black/25">
      {avatarSrc ? (
        <img
          alt={imageAlt}
          className="size-full object-cover"
          loading="lazy"
          src={avatarSrc}
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <span className="text-3xl font-bold text-indigo-200 dark:text-slate-600">
            {auntie.name.charAt(0)}
          </span>
        </div>
      )}
      <figcaption className="gold-auntie-caption absolute inset-x-0 bottom-0 bg-black/55 px-3 pb-2.5 pt-6">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {auntie.name}
          </span>
          {auntie.rating > 0 ? (
            <span className="flex items-center gap-0.5 text-xs font-medium text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <Star size={12} weight="fill" />
              {auntie.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <span className="truncate text-[11px] font-medium text-white/85 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            {auntie.role}
          </span>
          {auntie.completedCount > 0 ? (
            <span className="text-[10px] font-medium text-white/70">
              {auntie.completedCount}单
            </span>
          ) : null}
        </div>
      </figcaption>
    </figure>
  )
}

function GoldAuntieImageMarquee({
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
        className="gold-auntie-marquee flex w-max"
        data-reverse={reverse}
      >
        {[0, 1, 2, 3].map((groupIndex) => (
          <div
            aria-hidden={groupIndex > 0}
            className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
            key={groupIndex}
          >
            {images.map((src, index) => (
              <figure
                className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-blue-50 shadow-md shadow-blue-100/45 sm:w-36 lg:w-40 dark:bg-slate-900 dark:shadow-blue-950/25"
                key={`${groupIndex}-${src}`}
              >
                <img
                  alt={`${imageAlt} ${startIndex + index + 1}`}
                  className="size-full object-cover"
                  loading="lazy"
                  src={src}
                />
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { GoldAuntiesSection }
