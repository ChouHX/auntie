"use client"

import { useEffect, useRef, useState } from "react"
import { Star } from "@phosphor-icons/react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { getAuntieAvatarSrc } from "@/lib/auntie-assignment"
import { getAuntieRatingClassName, type AuntieStats } from "@/lib/auntie-stats"
import { fetchAuntieDetail, type AuntieDetail } from "@/lib/cms-api"
import { cn } from "@/lib/utils"
import type { CmsTeamMember, CmsTeamMemberStatus } from "@/types/cms"

const auntieStatusMeta: Record<
  CmsTeamMemberStatus,
  { className: string; dotClass: string; label: string }
> = {
  available: {
    className: "bg-emerald-50 text-emerald-600",
    dotClass: "bg-emerald-500",
    label: "空闲",
  },
  "off-duty": {
    className: "bg-gray-100 text-gray-500",
    dotClass: "bg-gray-400",
    label: "休息",
  },
  "on-leave": {
    className: "bg-amber-50 text-amber-600",
    dotClass: "bg-amber-500",
    label: "请假",
  },
  "on-task": {
    className: "bg-blue-50 text-blue-600",
    dotClass: "bg-blue-500",
    label: "服务中",
  },
}

function AuntieProfilePopover({
  align = "start",
  member,
  showStatusDot = true,
  stats,
  token,
  triggerClassName,
}: {
  align?: "center" | "end" | "start"
  member: CmsTeamMember
  showStatusDot?: boolean
  stats?: Partial<AuntieStats>
  token?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<AuntieDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const fetchingRef = useRef(false)

  const status = auntieStatusMeta[member.status]
  const avatarSrc = getAuntieAvatarSrc(member)

  // Merge fetched detail with summary member data
  const fullMember: CmsTeamMember = detail ? { ...member, ...detail } : member
  const serviceAreaText =
    fullMember.area?.trim() ||
    fullMember.serviceAreas?.filter((area) => area.trim()).join("、") ||
    "未填写"

  const completedCount =
    stats?.completedCount ?? detail?.completedCount ?? member.completedCount
  const reviewCount =
    stats?.reviewCount ?? detail?.reviewCount ?? (member.rating > 0 ? 1 : 0)
  const avgRating = stats?.avgRating ?? detail?.avgRating ?? member.rating
  const ratingStats: AuntieStats = {
    avgRating,
    completedCount,
    reviewCount,
  }

  useEffect(() => {
    if (!open || !token || detail || fetchingRef.current) {
      return
    }

    let cancelled = false
    fetchingRef.current = true
    setIsLoadingDetail(true)

    fetchAuntieDetail(token, member.id)
      .then((data) => {
        if (!cancelled) {
          setDetail(data)
        }
      })
      .catch(() => {
        // Silently fail — popover still shows summary data
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDetail(false)
        }
        fetchingRef.current = false
      })

    return () => {
      cancelled = true
      fetchingRef.current = false
    }
  }, [open, token, member.id, detail])

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label={`查看${member.name}详情`}
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center overflow-visible rounded-full border border-border bg-muted text-sm font-semibold transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            triggerClassName
          )}
          type="button"
        >
          {avatarSrc ? (
            <img
              alt=""
              className="size-full rounded-full object-cover"
              loading="lazy"
              src={avatarSrc}
            />
          ) : (
            <span className="flex size-full items-center justify-center rounded-full bg-primary text-white">
              {member.name.charAt(0)}
            </span>
          )}
          {showStatusDot ? (
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card",
                status.dotClass
              )}
            />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="flex w-72 flex-col gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-white">
            {avatarSrc ? (
              <img
                alt=""
                className="size-full object-cover"
                loading="lazy"
                src={avatarSrc}
              />
            ) : (
              <span>{member.name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {member.name}
              </span>
              <Badge
                className={cn("px-2 py-0.5 text-[11px]", status.className)}
              >
                {status.label}
              </Badge>
            </div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">
              {member.role}
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-xs">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="shrink-0 text-muted-foreground">服务区域</span>
            <strong className="min-w-0 text-right font-medium text-foreground">
              {serviceAreaText}
            </strong>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="shrink-0 text-muted-foreground">评分</span>
            {avgRating > 0 ? (
              <strong
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium text-amber-500",
                  getAuntieRatingClassName(ratingStats)
                )}
              >
                <Star size={12} weight="fill" />
                {avgRating.toFixed(1)}
              </strong>
            ) : (
              <strong className="text-xs font-medium text-muted-foreground">
                暂无评价
              </strong>
            )}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="shrink-0 text-muted-foreground">完成订单</span>
            <strong className="min-w-0 text-right font-medium text-foreground">
              {completedCount} 单
            </strong>
          </div>
          {isLoadingDetail ? (
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="shrink-0 text-muted-foreground">加载中…</span>
            </div>
          ) : null}
          {fullMember.phone ? (
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="shrink-0 text-muted-foreground">电话</span>
              <strong className="min-w-0 text-right font-medium text-foreground">
                {fullMember.phone}
              </strong>
            </div>
          ) : null}
          {fullMember.currentOrder ? (
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="shrink-0 text-muted-foreground">当前订单</span>
              <strong className="min-w-0 text-right font-mono font-medium text-primary">
                {fullMember.currentOrder}
              </strong>
            </div>
          ) : null}
        </div>

        {fullMember.serviceAreas?.length ? (
          <div className="flex flex-wrap gap-1.5 border-t border-border pt-2">
            {fullMember.serviceAreas.slice(0, 4).map((area) => (
              <Badge key={area} variant="secondary">
                {area}
              </Badge>
            ))}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export { AuntieProfilePopover, auntieStatusMeta }
