import {
  CheckCircle,
  ClockCounterClockwise,
  Crosshair,
  SpinnerGap,
} from "@phosphor-icons/react"

import type { ServiceLocation } from "@/data/site"
import type { LocationStatus } from "@/hooks/use-nearest-service-location"
import type { VisitorLocation } from "@/lib/geo"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type LocationStatusCardProps = {
  activeLocation?: ServiceLocation
  className?: string
  embedded?: boolean
  status: LocationStatus
  visitorLocation: VisitorLocation | null
}

function LocationStatusCard({
  activeLocation,
  className,
  embedded = false,
  status,
  visitorLocation,
}: LocationStatusCardProps) {
  const statusText = getLocationStatusText(
    status,
    visitorLocation,
    activeLocation
  )

  return (
    <Card
      className={cn(
        embedded
          ? "border-0 bg-transparent p-0 shadow-none"
          : "relative overflow-hidden rounded-xl border-border bg-card/78 p-4 shadow-sm shadow-blue-100/40 backdrop-blur transition duration-300 hover:shadow-xl hover:shadow-blue-100/60",
        className
      )}
    >
      {!embedded ? (
        <div className="absolute inset-y-0 left-0 w-1 bg-blue-700" />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shadow-inner shadow-blue-100">
            <Crosshair weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  status === "located"
                    ? "default"
                    : status === "locating"
                      ? "secondary"
                      : "amber"
                }
              >
                {status === "located" ? (
                  <CheckCircle weight="fill" />
                ) : status === "locating" ? (
                  <SpinnerGap className="animate-spin" weight="bold" />
                ) : (
                  <ClockCounterClockwise weight="fill" />
                )}
                {status === "located"
                  ? "IP 已定位"
                  : status === "locating"
                    ? "正在定位"
                    : "回退推荐"}
              </Badge>
              {activeLocation ? (
                <span className="text-sm font-semibold text-slate-950">
                  {activeLocation.city} · {activeLocation.country}
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {statusText}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:min-w-[360px] sm:grid-cols-2">
          <CompactInfo
            label="当前推荐"
            value={
              activeLocation
                ? `${activeLocation.city} · ${activeLocation.country}`
                : "默认服务城市"
            }
          />
          <CompactInfo
            label="访问位置"
            value={
              visitorLocation
                ? `${visitorLocation.city} · ${visitorLocation.country}`
                : "正在定位"
            }
          />
        </div>
      </div>
    </Card>
  )
}

type CompactInfoProps = {
  label: string
  value: string
}

function CompactInfo({ label, value }: CompactInfoProps) {
  return (
    <div className="rounded-lg border border-border bg-card/72 px-3 py-2 shadow-sm shadow-blue-100/40">
      <div className="text-[11px] font-medium tracking-[0.12em] text-slate-400 uppercase">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-950">
        {value}
      </div>
    </div>
  )
}

function getLocationStatusText(
  status: LocationStatus,
  visitorLocation: VisitorLocation | null,
  activeLocation?: ServiceLocation
) {
  if (status === "locating") {
    return "正在估算访问位置，并将地图旋转到最近的服务区域。"
  }

  const recommended = activeLocation
    ? `${activeLocation.city} · ${activeLocation.country}`
    : "默认服务城市"

  if (status === "located" && visitorLocation) {
    return `已定位到 ${visitorLocation.city} · ${visitorLocation.country} 附近，推荐 ${recommended}。`
  }

  if (visitorLocation?.source === "timezone") {
    return `IP 定位不可用，已按浏览器时区估算位置，并推荐 ${recommended}。`
  }

  return `定位失败，已按默认城市推荐 ${recommended}。`
}

export { LocationStatusCard }
