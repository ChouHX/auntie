import Image from "next/image"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, MagnifyingGlassPlus } from "@phosphor-icons/react"
import { Link } from "@/lib/router-compat"

import { Section, SectionHeading } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { ImagePreviewer } from "@/components/ui/image-previewer"
import { useCmsContent } from "@/hooks/use-cms-content"
import { resolveReviewImageSources } from "@/lib/image-sources"
import { useI18n } from "@/lib/i18n"

type ReviewImageItem = {
  alt: string
  detailSrc: string
  index: number
  src: string
  thumbnailSrc: string
}

function TestimonialsSection() {
  const { dict } = useI18n()
  const { content } = useCmsContent()
  const galleryRef = useRef<HTMLDivElement | null>(null)
  const [isGalleryVisible, setIsGalleryVisible] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const reviewScreenshotImages = useMemo(
    () =>
      content.reviewItems
        .filter((item) => item.status === "published")
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map((item, index) => {
          const sources = resolveReviewImageSources(item)

          return {
            alt: `客户好评聊天记录 ${index + 1}`,
            detailSrc: sources.detailSrc,
            index,
            src: sources.thumbnailSrc,
            thumbnailSrc: sources.thumbnailSrc,
          }
        }),
    [content.reviewItems]
  )
  const reviewScreenshotRows = useMemo(
    () => splitIntoRows(reviewScreenshotImages),
    [reviewScreenshotImages]
  )

  useEffect(() => {
    const element = galleryRef.current

    if (!element || !("IntersectionObserver" in window)) {
      setIsGalleryVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setIsGalleryVisible(entries.some((entry) => entry.isIntersecting))
      },
      {
        rootMargin: "240px 0px",
        threshold: 0.01,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <Section className="overflow-hidden text-slate-950 dark:text-white">
      <div className="flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
        <SectionHeading
          kicker={dict.testimonials.kicker}
          title={dict.testimonials.title}
          kickerClassName="dark:text-blue-200"
          titleClassName="dark:text-white"
        />
        <div className="flex max-w-xl flex-col items-start gap-3 sm:gap-4 md:items-end">
          <p className="flex items-center gap-2 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 dark:text-slate-300">
            <MagnifyingGlassPlus
              className="shrink-0 text-blue-700 dark:text-blue-300"
              size={20}
              weight="fill"
            />
            {dict.testimonials.description}
          </p>
          <Button
            asChild
            className="h-9 px-4 text-sm sm:h-10 sm:px-6"
            variant="brandStrong"
          >
            <Link to="/booking">
              {dict.common.bookNow}
              <ArrowRight weight="bold" />
            </Link>
          </Button>
        </div>
      </div>

      <div
        ref={galleryRef}
        className="testimonials-gallery relative mt-6 space-y-3 sm:mt-10 sm:space-y-4"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/85 to-transparent sm:w-28 dark:from-slate-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/85 to-transparent sm:w-28 dark:from-slate-950" />

        {reviewScreenshotRows.map((row, index) => (
          <ReviewScreenshotMarquee
            images={row}
            isPaused={!isGalleryVisible || previewIndex !== null}
            key={index}
            onOpen={setPreviewIndex}
            reverse={index % 2 === 1}
          />
        ))}
      </div>

      <ImagePreviewer
        images={reviewScreenshotImages}
        onOpenChange={setPreviewIndex}
        openIndex={previewIndex}
      />
    </Section>
  )
}

type ReviewScreenshotMarqueeProps = {
  images: ReviewImageItem[]
  isPaused: boolean
  onOpen: (index: number) => void
  reverse?: boolean
}

const ReviewScreenshotMarquee = memo(function ReviewScreenshotMarquee({
  images,
  isPaused,
  onOpen,
  reverse,
}: ReviewScreenshotMarqueeProps) {
  return (
    <div className="review-image-marquee-row overflow-hidden">
      <div
        className="review-image-marquee flex w-max transform-gpu"
        data-paused={isPaused ? "true" : undefined}
        data-reverse={reverse ? "true" : undefined}
      >
        {[0, 1].map((groupIndex) => (
          <div key={groupIndex} className="flex shrink-0 gap-3 pr-3">
            {images.map((image, imageIndex) => (
              <ReviewImageCard
                key={`${groupIndex}-${image.thumbnailSrc}`}
                eager={groupIndex === 0 && imageIndex < 3}
                image={image}
                onOpen={onOpen}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
})

type ReviewImageCardProps = {
  eager: boolean
  image: ReviewImageItem
  onOpen: (index: number) => void
}

function ReviewImageCard({ eager, image, onOpen }: ReviewImageCardProps) {
  return (
    <button
      aria-label={`查看${image.alt}`}
      className="group relative h-[180px] w-[124px] shrink-0 overflow-hidden rounded-xl border border-border bg-card/88 p-1.5 text-left shadow-lg shadow-blue-100/45 transition-[box-shadow] duration-300 hover:shadow-xl hover:shadow-blue-100/65 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-[250px] sm:w-[174px] sm:rounded-2xl sm:p-2 lg:h-[280px] lg:w-[194px] dark:border-white/10 dark:bg-white/[0.08] dark:shadow-none dark:hover:shadow-blue-950/30 dark:focus-visible:ring-blue-300"
      onClick={() => onOpen(image.index)}
      onFocus={() => preloadReviewImage(image.detailSrc)}
      onPointerEnter={() => preloadReviewImage(image.detailSrc)}
      type="button"
    >
      <LazyReviewImage src={image.thumbnailSrc} alt={image.alt} eager={eager} />
      <span className="pointer-events-none absolute inset-1.5 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition duration-300 group-focus-within:bg-black/46 group-focus-within:opacity-100 group-hover:bg-black/46 group-hover:opacity-100 sm:inset-2 sm:rounded-xl">
        <MagnifyingGlassPlus
          aria-hidden="true"
          className="text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
          focusable="false"
          size={38}
          weight="bold"
        />
      </span>
    </button>
  )
}

type LazyReviewImageProps = {
  alt: string
  eager?: boolean
  src: string
}

function LazyReviewImage({ alt, eager = false, src }: LazyReviewImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [shouldLoad, setShouldLoad] = useState(eager)

  useEffect(() => {
    if (shouldLoad || eager) {
      return
    }

    const element = containerRef.current

    if (!element || !("IntersectionObserver" in window)) {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "900px 1200px",
        threshold: 0.01,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [eager, shouldLoad])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-xl bg-blue-50/60 dark:bg-slate-950/80"
    >
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          className="object-contain"
          fill
          fetchPriority={eager ? "high" : "low"}
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 640px) 124px, (max-width: 1024px) 174px, 194px"
        />
      ) : (
        <div className="review-image-placeholder h-full w-full" />
      )}
    </div>
  )
}

function splitIntoRows(images: ReviewImageItem[]) {
  const middle = Math.ceil(images.length / 2)

  return [images.slice(0, middle), images.slice(middle)]
}

function preloadReviewImage(src?: string) {
  if (!src || preloadedReviewImages.has(src)) {
    return
  }

  preloadedReviewImages.add(src)
  const image = new window.Image()
  image.decoding = "async"
  image.src = src
}

const preloadedReviewImages = new Set<string>()

export { TestimonialsSection }
