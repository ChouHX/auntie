"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

type ChartConfig = Record<
  string,
  {
    color?: string
    label?: React.ReactNode
  }
>

type ChartContextProps = {
  config: ChartConfig
}

type TooltipPayloadItem = {
  color?: string
  dataKey?: string | number
  fill?: string
  name?: string | number
  payload?: Record<string, unknown>
  value?: number | string
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
    config: ChartConfig
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs text-muted-foreground [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer debounce={160}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

function ChartStyle({ id, config }: { config: ChartConfig; id: string }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {
${colorConfig
  .map(([key, item]) => `  --color-${key}: ${item.color};`)
  .join("\n")}
}`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend

function ChartTooltipContent({
  active,
  className,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  label,
  labelFormatter,
  nameKey,
  payload,
  valueFormatter,
}: {
  active?: boolean
  className?: string
  hideIndicator?: boolean
  hideLabel?: boolean
  indicator?: "dot" | "line" | "dashed"
  label?: React.ReactNode
  labelFormatter?: (
    label: React.ReactNode,
    payload: TooltipPayloadItem[]
  ) => React.ReactNode
  nameKey?: string
  payload?: TooltipPayloadItem[]
  valueFormatter?: (
    value: number | string,
    item: TooltipPayloadItem
  ) => React.ReactNode
}) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  const normalizedPayload = payload as TooltipPayloadItem[]
  const labelItem = normalizedPayload[0]
  const labelKey = `${label || labelItem?.dataKey || labelItem?.name || ""}`
  const labelValue = labelItem
    ? getPayloadConfigLabel(config, labelItem, labelKey)
    : ""
  const tooltipLabel =
    hideLabel || !labelItem ? null : labelFormatter ? (
      <div className="font-medium">
        {labelFormatter(labelValue, normalizedPayload)}
      </div>
    ) : labelValue ? (
      <div className="font-medium">{labelValue}</div>
    ) : null

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs shadow-xl",
        className
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {normalizedPayload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || ""}`
          const itemConfigLabel = getPayloadConfigLabel(config, item, key)
          const indicatorColor =
            item.color || item.fill || `var(--color-${key})`

          return (
            <div
              key={`${key}-${index}`}
              className="flex min-w-0 items-center gap-2"
            >
              {hideIndicator ? null : (
                <span
                  className={cn(
                    "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                    indicator === "dot" && "size-2.5",
                    indicator === "line" && "h-2.5 w-1",
                    indicator === "dashed" &&
                      "h-0 w-0 border-[1.5px] border-dashed bg-transparent"
                  )}
                  style={
                    {
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor,
                    } as React.CSSProperties
                  }
                />
              )}
              <span className="min-w-0 flex-1 text-muted-foreground">
                {itemConfigLabel}
              </span>
              {item.value !== undefined ? (
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {valueFormatter && item.value !== undefined
                    ? valueFormatter(item.value, item)
                    : item.value}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegendContent({
  className,
  payload,
  nameKey,
}: React.ComponentProps<"div"> & {
  nameKey?: string
  payload?: Array<{
    color?: string
    dataKey?: string | number
    value?: string | number
  }>
}) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 pt-3 text-xs",
        className
      )}
    >
      {payload.map((item, index) => {
        const key = `${nameKey || item.dataKey || item.value || ""}`

        return (
          <div
            key={`${key}-${index}`}
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: item.color || `var(--color-${key})`,
              }}
            />
            {config[key]?.label || item.value}
          </div>
        )
      })}
    </div>
  )
}

function getPayloadConfigLabel(
  config: ChartConfig,
  payload: TooltipPayloadItem,
  key: string
) {
  const payloadValue =
    payload.payload && typeof payload.payload === "object"
      ? payload.payload[key]
      : undefined
  const configKey = String(payloadValue || key)

  return config[configKey]?.label || payload.name || payload.dataKey || key
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
}
