"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type DigitEffect = "none" | "fade" | "slide"

type CountUpProps = Omit<React.ComponentProps<"span">, "children"> & {
  decimals?: number
  digitEffect?: DigitEffect
  direction?: "up" | "down"
  duration?: number
  from?: number
  separator?: string
  to: number
}

function CountUp({
  className,
  decimals,
  digitEffect = "none",
  direction = "up",
  duration = 1.8,
  from,
  separator = ",",
  to,
  ...props
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const startValue = from ?? (direction === "down" ? to : 0)
  const [value, setValue] = React.useState(startValue)
  const [hasEntered, setHasEntered] = React.useState(false)
  const resolvedDecimals = decimals ?? inferDecimals(startValue, to)

  React.useEffect(() => {
    const node = ref.current

    if (!node) {
      return
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      const frameId = requestAnimationFrame(() => setValue(to))

      return () => cancelAnimationFrame(frameId)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEntered(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [to])

  React.useEffect(() => {
    if (!hasEntered) {
      return
    }

    let frameId = 0
    const startTime = performance.now()
    const durationMs = Math.max(duration, 0.1) * 1000
    const delta = to - startValue

    function update(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1)
      const eased = easeOutCubic(progress)

      setValue(startValue + delta * eased)

      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        setValue(to)
      }
    }

    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [duration, hasEntered, startValue, to])

  return (
    <span
      ref={ref}
      className={cn("tabular-nums", className)}
      data-digit-effect={digitEffect}
      {...props}
    >
      {formatNumber(value, resolvedDecimals, separator)}
    </span>
  )
}

function inferDecimals(...values: number[]) {
  return values.reduce((maxDecimals, value) => {
    const [, decimal = ""] = String(value).split(".")

    return Math.max(maxDecimals, decimal.length)
  }, 0)
}

function formatNumber(value: number, decimals: number, separator: string) {
  const fixedValue = value.toFixed(decimals)
  const [integerPart, decimalPart] = fixedValue.split(".")
  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    separator
  )

  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3)
}

export { CountUp, type DigitEffect }
