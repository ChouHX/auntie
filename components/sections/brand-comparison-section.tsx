"use client"

import { Check, MagnifyingGlassPlus, Warning, X } from "@phosphor-icons/react"
import Image from "next/image"
import { useState } from "react"

import { Section } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { ImagePreviewer } from "@/components/ui/image-previewer"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"
import { getSiteLogo } from "@/lib/site-settings"
import { cn } from "@/lib/utils"

type ComparisonStatus = "bad" | "good" | "none" | "warn"

const statusConfig = {
  bad: {
    icon: X,
    label: "No",
    className: "text-red-500",
  },
  good: {
    icon: Check,
    label: "Yes",
    className: "text-emerald-600 dark:text-emerald-300",
  },
  none: {
    icon: null,
    label: "Not applicable",
    className: "text-slate-300 dark:text-slate-600",
  },
  warn: {
    icon: Warning,
    label: "Limited",
    className: "text-amber-500 dark:text-amber-300",
  },
} satisfies Record<
  ComparisonStatus,
  {
    className: string
    icon: typeof Check | typeof Warning | typeof X | null
    label: string
  }
>

function BrandComparisonSection() {
  const { dict } = useI18n()
  const comparison = dict.brandComparison

  return (
    <Section className="py-10 sm:py-12">
      <h2 className="mx-auto max-w-4xl text-center text-2xl leading-tight font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl dark:text-white">
        {comparison.title}
      </h2>

      <BrandComparisonImage className="mt-7" />
    </Section>
  )
}

function BrandComparisonImage({ className }: { className?: string }) {
  const { dict } = useI18n()
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const image = {
    alt: dict.brandComparison.title,
    detailSrc: "/compare.png",
    mobileLandscape: true,
    src: "/compare.png",
  }

  return (
    <div className={cn("relative", className)}>
      <Card className="animate-fade-up overflow-hidden rounded-lg border-border/80 bg-white shadow-lg shadow-blue-100/35 dark:border-white/10 dark:bg-slate-900 dark:shadow-blue-950/20">
        <a
          aria-label={image.alt}
          className="block bg-white md:hidden"
          href={image.detailSrc}
          rel="noreferrer"
          target="_blank"
        >
          <Image
            alt={image.alt}
            className="block h-auto w-full object-contain"
            height={603}
            loading="lazy"
            sizes="100vw"
            src={image.src}
            width={1199}
          />
        </a>
        <button
          aria-label="放大查看对比图"
          className="group relative hidden w-full bg-white text-left focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none md:block dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-slate-950"
          onClick={() => setPreviewIndex(0)}
          onFocus={() => preloadComparisonImage(image.detailSrc)}
          onPointerEnter={() => preloadComparisonImage(image.detailSrc)}
          type="button"
        >
          <Image
            alt={image.alt}
            className="block h-auto w-full object-contain"
            height={603}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 1120px"
            src={image.src}
            width={1199}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition duration-200 group-hover:bg-slate-950/18 group-hover:opacity-100 group-focus-visible:bg-slate-950/18 group-focus-visible:opacity-100">
            <span className="flex size-11 items-center justify-center rounded-full bg-white/95 text-blue-700 shadow-xl shadow-slate-950/20 sm:size-12">
              <MagnifyingGlassPlus className="size-5 sm:size-6" weight="bold" />
            </span>
          </span>
        </button>
      </Card>

      <ImagePreviewer
        images={[image]}
        onOpenChange={setPreviewIndex}
        openIndex={previewIndex}
      />
    </div>
  )
}

function BrandComparisonTable({ className }: { className?: string }) {
  const { dict } = useI18n()
  const { content } = useCmsContent()
  const comparison = dict.brandComparison
  const logoImage = getSiteLogo(content)

  return (
    <Card
      className={cn(
        "animate-fade-up overflow-hidden rounded-lg border-border/80 bg-card/82 shadow-lg shadow-blue-100/35 dark:bg-slate-900/80 dark:shadow-blue-950/20",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[11px] sm:min-w-[760px] sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white">
              <th className="w-[27%] px-2 py-2.5 text-left font-semibold sm:px-3 sm:py-3">
                {comparison.featureColumn}
              </th>
              <th className="w-[18.25%] px-2 py-2.5 text-center font-semibold text-blue-700 sm:px-3 sm:py-3 dark:text-blue-200">
                <span className="inline-flex items-center justify-center gap-2">
                  <img
                    alt=""
                    className="size-4 rounded-sm bg-white object-cover ring-1 ring-blue-100 sm:size-5 dark:ring-white/10"
                    src={logoImage}
                  />
                  {comparison.brandColumn}
                </span>
              </th>
              {comparison.competitorColumns.map((column) => (
                <th
                  key={column}
                  className="w-[18.25%] px-2 py-2.5 text-center font-semibold sm:px-3 sm:py-3"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row, rowIndex) => (
              <tr
                key={row.feature}
                className={cn(
                  "border-b border-white/70 last:border-b-0 dark:border-white/5",
                  rowIndex % 2 === 0
                    ? "bg-blue-50/55 dark:bg-white/[0.04]"
                    : "bg-card/55 dark:bg-slate-900/60"
                )}
              >
                <th className="px-2 py-2 text-left text-[11px] leading-4 font-semibold text-slate-800 sm:px-3 sm:py-2.5 sm:text-sm sm:leading-5 dark:text-slate-100">
                  {row.feature}
                </th>
                {row.values.map((status, columnIndex) => (
                  <td
                    key={`${row.feature}-${columnIndex}`}
                    className="px-2 py-2 text-center sm:px-3 sm:py-2.5"
                  >
                    <StatusIcon status={status as ComparisonStatus} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function StatusIcon({ status }: { status: ComparisonStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  if (!Icon) {
    return (
      <span
        aria-label={config.label}
        className="inline-block size-4 sm:size-5"
        role="img"
      />
    )
  }

  return (
    <span
      aria-label={config.label}
      className={cn(
        "inline-flex items-center justify-center",
        config.className
      )}
      role="img"
    >
      <Icon className="size-4 sm:size-5" weight="bold" />
    </span>
  )
}

function preloadComparisonImage(src: string) {
  if (preloadedComparisonImages.has(src)) {
    return
  }

  preloadedComparisonImages.add(src)
  const image = new window.Image()
  image.decoding = "async"
  image.src = src
}

const preloadedComparisonImages = new Set<string>()

export { BrandComparisonImage, BrandComparisonSection, BrandComparisonTable }
