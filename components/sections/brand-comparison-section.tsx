import { Check, Warning, X } from "@phosphor-icons/react"
import Image from "next/image"

import { Section } from "@/components/common/section"
import { Card } from "@/components/ui/card"
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

      <BrandComparisonTable className="mt-7" />
    </Section>
  )
}

function BrandComparisonTable({ className }: { className?: string }) {
  const { dict } = useI18n()
  const { content } = useCmsContent(["siteSettings"])
  const comparison = dict.brandComparison
  const logoImage = getSiteLogo(content)

  return (
    <div className={cn("animate-fade-up", className)}>
      <Card className="overflow-hidden rounded-lg border-border/80 bg-card/82 shadow-lg shadow-blue-100/35 md:hidden dark:bg-slate-900/80 dark:shadow-blue-950/20">
        <a
          aria-label={comparison.title}
          className="block bg-white"
          href="/compare.png"
          rel="noreferrer"
          target="_blank"
        >
          <Image
            alt={comparison.title}
            className="block h-auto w-full"
            height={607}
            sizes="100vw"
            src="/compare.png"
            width={1215}
          />
        </a>
      </Card>

      <Card className="hidden overflow-hidden rounded-lg border-border/80 bg-card/82 shadow-lg shadow-blue-100/35 md:block dark:bg-slate-900/80 dark:shadow-blue-950/20">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[11px] sm:min-w-[760px] sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                <th className="w-[27%] px-2 py-2.5 text-left font-semibold sm:px-3 sm:py-3">
                  {comparison.featureColumn}
                </th>
                <th className="w-[18.25%] px-2 py-2.5 text-center font-semibold text-blue-700 sm:px-3 sm:py-3 dark:text-blue-200">
                  <span className="inline-flex items-center justify-center gap-2">
                    <Image
                      alt=""
                      className="size-4 rounded-sm bg-white object-cover ring-1 ring-blue-100 sm:size-5 dark:ring-white/10"
                      height={20}
                      src={logoImage}
                      width={20}
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
    </div>
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

export { BrandComparisonSection, BrandComparisonTable }
