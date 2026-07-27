import { ArrowRight, CaretRight, CheckCircle, X } from "@phosphor-icons/react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "@/lib/router-compat"

import { Section, SectionHeading } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { serviceAnchorIds } from "@/data/site"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const serviceImages = [
  { src: "/services/regular.jpg", position: "40% 20%" },
  { src: "/services/deep.jpg", position: "62% 14%" },
  { src: "/services/post-renovation.jpg", position: "58% 30%" },
  { src: "/services/move-out.jpg", position: "54% 20%" },
  { src: "/services/commercial.jpg", position: "58% 40%" },
  { src: "/services/recurring.jpg", position: "58% 30%" },
] as const

type ServicesSectionProps = {
  anchorPrefix?: string
  id?: string
  showHeading?: boolean
}

function ServicesSection({
  anchorPrefix = "",
  id = "services",
  showHeading = true,
}: ServicesSectionProps) {
  const { dict } = useI18n()
  const services = dict.servicesSection.items

  return (
    <Section
      data-scroll-reveal="false"
      id={id}
      className={cn(
        "overflow-hidden transition-colors duration-300",
        showHeading ? "py-10 sm:py-16" : "pt-8 pb-10 sm:pt-12 sm:pb-16"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(37,99,235,0.1),transparent_26%),radial-gradient(circle_at_88%_16%,rgba(14,165,233,0.08),transparent_24%)] dark:bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.16),transparent_26%),radial-gradient(circle_at_88%_16%,rgba(14,165,233,0.12),transparent_24%)]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 14%, #000 78%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 14%, #000 78%, transparent 100%)",
        }}
      />
      <div className="relative">
        {showHeading ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              kicker={dict.servicesSection.kicker}
              title={dict.servicesSection.title}
              description={dict.servicesSection.description}
              className="max-w-3xl"
            />
            <Button
              asChild
              className="h-9 w-fit px-4 text-sm sm:h-10 sm:px-6"
              variant="brandStrong"
            >
              <Link to="/booking">
                {dict.common.bookNow}
                <ArrowRight weight="bold" />
              </Link>
            </Button>
          </div>
        ) : null}

        {/* ── Mobile: compact 2-col grid, tap to expand ── */}
        <div
          className={cn(
            "grid grid-cols-2 gap-2.5 sm:hidden",
            showHeading && "mt-6"
          )}
        >
          {services.map((service, index) => (
            <MobileServiceCard
              key={service.title}
              anchorPrefix={anchorPrefix}
              service={service}
              index={index}
            />
          ))}
        </div>

        {/* ── Desktop / tablet: full cards ── */}
        <div
          className={cn(
            "hidden gap-4 sm:grid md:grid-cols-2 lg:grid-cols-3",
            showHeading && "mt-8"
          )}
        >
          {services.map((service, index) => (
            <Card
              id={`${anchorPrefix}${serviceAnchorIds[index]}`}
              key={service.title}
              className="group animate-fade-up scroll-mt-28 overflow-hidden rounded-xl bg-card/88 shadow-md shadow-blue-100/40 hover:shadow-lg hover:shadow-blue-100/55 dark:bg-slate-900/88 dark:shadow-blue-950/24 dark:hover:shadow-blue-950/34"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-blue-50/70 dark:bg-slate-800">
                <ServiceImage
                  src={(serviceImages[index] ?? serviceImages[0]).src}
                  alt={service.title}
                  objectPosition={
                    (serviceImages[index] ?? serviceImages[0]).position
                  }
                  priority={index < 3}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/76 via-slate-950/20 to-transparent px-5 pt-12 pb-4 text-white">
                  <div className="text-[10px] font-semibold tracking-[0.14em] text-blue-100/85 uppercase sm:text-xs sm:tracking-[0.16em]">
                    {service.tag}
                  </div>
                  <h3 className="mt-1 text-base leading-tight font-semibold tracking-[-0.04em] sm:text-xl">
                    {service.title}
                  </h3>
                </div>
              </div>

              <div className="min-w-0 p-4">
                <p className="line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {service.text}
                </p>
                <div className="mt-4 grid gap-2">
                  {service.points.slice(0, 2).map((point) => (
                    <div
                      key={point}
                      className="flex items-center gap-2 text-sm leading-5 text-slate-700 dark:text-slate-200"
                    >
                      <CheckCircle
                        className="shrink-0 text-blue-700 dark:text-blue-300"
                        size={17}
                        weight="fill"
                      />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  )
}

type MobileServiceCardProps = {
  anchorPrefix: string
  service: {
    title: string
    tag: string
    text: string
    points: readonly string[]
  }
  index: number
}

function MobileServiceCard({
  anchorPrefix,
  service,
  index,
}: MobileServiceCardProps) {
  const imageData = serviceImages[index] ?? serviceImages[0]

  return (
    <div
      id={`${anchorPrefix}${serviceAnchorIds[index]}`}
      className="scroll-mt-28"
    >
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="block w-full overflow-hidden rounded-xl bg-card/88 text-left shadow-md shadow-blue-100/40 transition hover:shadow-lg hover:shadow-blue-100/55 dark:bg-slate-900/88 dark:shadow-blue-950/24"
            aria-label={`${service.title}详情`}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-blue-50/70 dark:bg-slate-800">
              <ServiceImage
                src={imageData.src}
                alt={service.title}
                objectPosition={imageData.position}
                priority={index < 3}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-2.5 pt-8 pb-2 text-white">
                <div className="text-[9px] font-semibold tracking-[0.1em] text-blue-100/85 uppercase">
                  {service.tag}
                </div>
                <h3 className="mt-0.5 text-sm leading-tight font-semibold">
                  {service.title}
                </h3>
              </div>
              <div className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm">
                <CaretRight size={14} weight="bold" />
              </div>
            </div>
          </button>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="w-[calc(100%-1.25rem)] max-w-md gap-0 overflow-hidden rounded-xl border-0 bg-card p-0 shadow-2xl sm:hidden dark:bg-slate-950"
        >
          <DialogClose className="absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-full bg-white/88 text-slate-800 shadow-sm transition hover:bg-white focus:ring-2 focus:ring-ring focus:outline-none dark:bg-slate-950/72 dark:text-white dark:hover:bg-slate-900">
            <X size={15} weight="bold" />
            <span className="sr-only">关闭</span>
          </DialogClose>

          <div className="relative aspect-[16/10] overflow-hidden bg-blue-50/70 dark:bg-slate-800">
            <ServiceImage
              src={imageData.src}
              alt={service.title}
              objectPosition={imageData.position}
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-4 pt-12 pb-4 text-white">
              <div className="text-[10px] font-semibold tracking-[0.12em] text-blue-100/85 uppercase">
                {service.tag}
              </div>
              <DialogTitle className="mt-1 text-xl leading-tight font-semibold">
                {service.title}
              </DialogTitle>
            </div>
          </div>

          <div className="max-h-[44dvh] overflow-y-auto overscroll-contain px-4 pt-4 pb-5">
            <DialogDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {service.text}
            </DialogDescription>
            <div className="mt-4 grid gap-2.5">
              {service.points.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-2 text-sm leading-5 text-slate-700 dark:text-slate-200"
                >
                  <CheckCircle
                    className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
                    size={16}
                    weight="fill"
                  />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type ServiceImageProps = {
  alt: string
  objectPosition: string
  priority: boolean
  src: string
}

function ServiceImage({
  alt,
  objectPosition,
  priority,
  src,
}: ServiceImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  )

  useEffect(() => {
    const image = imageRef.current

    if (!image) {
      return
    }

    if (image.complete) {
      setStatus(image.naturalWidth > 0 ? "loaded" : "error")
      return
    }

    setStatus("loading")
  }, [src])

  const handleLoad = useCallback(() => {
    setStatus("loaded")
  }, [])

  const handleError = useCallback(() => {
    setStatus("error")
  }, [])

  if (status === "error") {
    return (
      <div className="flex size-full items-center justify-center bg-[linear-gradient(135deg,#dceeff,#f8fdff_55%,#bfddff)] px-6 text-center dark:bg-[linear-gradient(135deg,#172a5a,#0f172a_55%,#1f43ad)]">
        <div className="max-w-48">
          <CheckCircle
            aria-hidden="true"
            className="mx-auto text-blue-700 dark:text-blue-200"
            size={28}
            weight="fill"
          />
          <p className="mt-3 text-sm leading-6 font-semibold text-blue-950 dark:text-blue-50">
            {alt}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {status === "loading" ? (
        <Skeleton className="absolute inset-0 rounded-none bg-blue-100/80 dark:bg-slate-800" />
      ) : null}
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          status === "loaded" ? "opacity-100" : "opacity-0"
        )}
        decoding="async"
        fill
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        onError={handleError}
        onLoad={handleLoad}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
        style={{
          objectFit: "cover",
          objectPosition,
        }}
      />
    </>
  )
}

export { ServicesSection }
