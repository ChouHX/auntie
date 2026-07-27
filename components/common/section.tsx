import * as React from "react"

import { cn } from "@/lib/utils"

type SectionProps = React.ComponentProps<"section"> & {
  innerClassName?: string
}

function Section({
  className,
  innerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative scroll-mt-20 py-10 sm:scroll-mt-24 sm:py-24",
        className
      )}
      {...props}
    >
      <div
        className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", innerClassName)}
      >
        {children}
      </div>
    </section>
  )
}

type SectionHeadingProps = {
  kicker: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  kickerClassName?: string
}

function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  className,
  titleClassName,
  descriptionClassName,
  kickerClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "animate-fade-up",
        align === "center" && "mx-auto max-w-3xl text-center",
        className
      )}
    >
      <SectionKicker className={kickerClassName}>{kicker}</SectionKicker>
      <h2
        className={cn(
          "mt-2 text-2xl font-semibold tracking-[-0.035em] text-balance sm:mt-3 sm:text-4xl",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7 dark:text-slate-300",
            descriptionClassName
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

function SectionKicker({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase sm:tracking-[0.18em] dark:text-blue-200",
        className
      )}
      {...props}
    />
  )
}

export { Section, SectionHeading, SectionKicker }
