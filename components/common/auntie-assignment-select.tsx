"use client"

import { useState } from "react"
import { ChatCircleText, MagicWand, Star } from "@phosphor-icons/react"
import { toast } from "sonner"

import { AuntieReviewsDialog } from "@/components/common/auntie-reviews-dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  AUTO_AUNTIE_VALUE,
  NO_AUNTIE_VALUE,
  getAuntieAvatarSrc,
  getEligibleAuntiesForArea,
  pickAutoAssignedAuntie,
  pickAutoAssignedAuntieFromPreFiltered,
  type AuntieAssignmentMode,
} from "@/lib/auntie-assignment"
import {
  fetchPublicAuntieReviews,
  type PublicAuntieReviewItem,
} from "@/lib/cms-api"
import { cn } from "@/lib/utils"
import type { CmsPaymentOrder, CmsTeamMember } from "@/types/cms"

type AuntieAssignmentChange = {
  assignedAuntieId?: string
  mode: AuntieAssignmentMode
}

function AuntieAssignmentSelect({
  assignedAuntieId,
  aunties,
  className,
  disabled,
  enableReviews = false,
  includeAuto = true,
  includeNone = true,
  mode,
  onChange,
  activeLoadByAuntieId = {},
  onlyAvailable = false,
  orders = [],
  placeholder = "选择服务阿姨",
  preFiltered = false,
  serviceArea,
}: {
  assignedAuntieId?: string
  aunties: CmsTeamMember[]
  className?: string
  disabled?: boolean
  enableReviews?: boolean
  includeAuto?: boolean
  includeNone?: boolean
  mode: AuntieAssignmentMode
  onChange: (change: AuntieAssignmentChange) => void
  activeLoadByAuntieId?: Record<string, number>
  onlyAvailable?: boolean
  orders?: CmsPaymentOrder[]
  placeholder?: string
  preFiltered?: boolean
  serviceArea: string
}) {
  const eligibleAunties = preFiltered
    ? onlyAvailable
      ? aunties.filter((a) => a.status === "available")
      : aunties
    : getEligibleAuntiesForArea(aunties, serviceArea, {
        onlyAvailable,
      })
  const [reviewAuntie, setReviewAuntie] = useState<CmsTeamMember | null>(null)
  const [reviews, setReviews] = useState<PublicAuntieReviewItem[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewPageSize, setReviewPageSize] = useState(5)
  const [reviewTotalCount, setReviewTotalCount] = useState(0)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  const [isReviewLoading, setIsReviewLoading] = useState(false)
  const selectedAuntie =
    aunties.find((auntie) => auntie.id === assignedAuntieId) ?? null
  const autoAuntie = preFiltered
    ? pickAutoAssignedAuntieFromPreFiltered(
        aunties,
        orders,
        activeLoadByAuntieId
      )
    : pickAutoAssignedAuntie(
        serviceArea,
        aunties,
        orders,
        activeLoadByAuntieId
      )
  const value =
    mode === "auto"
      ? AUTO_AUNTIE_VALUE
      : assignedAuntieId
        ? assignedAuntieId
        : NO_AUNTIE_VALUE

  async function loadReviews(auntie: CmsTeamMember, page: number, pageSize: number) {
    setIsReviewLoading(true)
    try {
      const result = await fetchPublicAuntieReviews(auntie.id, { page, pageSize })
      setReviews(result.reviews)
      setReviewPage(result.pagination.page)
      setReviewPageSize(result.pagination.pageSize)
      setReviewTotalCount(result.pagination.totalCount)
      setReviewTotalPages(result.pagination.totalPages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载评价失败")
    } finally {
      setIsReviewLoading(false)
    }
  }

  function startViewReviews(auntie: CmsTeamMember) {
    setReviewAuntie(auntie)
    setReviews([])
    setReviewPage(1)
    setReviewPageSize(5)
    setReviewTotalCount(0)
    setReviewTotalPages(1)
    void loadReviews(auntie, 1, 5)
  }

  function handleReviewPageChange(page: number) {
    if (!reviewAuntie) return
    void loadReviews(reviewAuntie, page, reviewPageSize)
  }

  function handleReviewPageSizeChange(pageSize: number) {
    if (!reviewAuntie) return
    void loadReviews(reviewAuntie, 1, pageSize)
  }

  const reviewTarget = mode === "auto" ? autoAuntie : selectedAuntie

  return (
    <>
      <Select
        disabled={disabled}
      onValueChange={(nextValue) => {
        if (nextValue === AUTO_AUNTIE_VALUE) {
          onChange({
            assignedAuntieId: autoAuntie?.id,
            mode: "auto",
          })
          return
        }

        if (nextValue === NO_AUNTIE_VALUE) {
          onChange({
            assignedAuntieId: undefined,
            mode: "manual",
          })
          return
        }

        onChange({
          assignedAuntieId: nextValue,
          mode: "manual",
        })
      }}
      value={value}
    >
      <SelectTrigger className={cn("h-9 rounded-md", className)}>
        {mode === "auto" ? (
          <span className="flex min-w-0 items-center gap-2">
            <MagicWand size={14} weight="bold" />
            <span className="truncate">自动分配</span>
            {autoAuntie ? (
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {autoAuntie.name}
              </span>
            ) : null}
          </span>
        ) : selectedAuntie ? (
          <AuntieSelectLabel auntie={selectedAuntie} />
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
      </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {includeAuto ? (
              <SelectItem value={AUTO_AUNTIE_VALUE}>
                <span className="flex min-w-0 items-center gap-2">
                  <MagicWand size={14} weight="bold" />
                  <span className="truncate">自动分配</span>
                  {autoAuntie ? (
                    <span className="text-xs text-muted-foreground">
                      推荐 {autoAuntie.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      暂无匹配阿姨
                    </span>
                  )}
                </span>
              </SelectItem>
            ) : null}
            {includeNone ? (
              <SelectItem value={NO_AUNTIE_VALUE}>不分配</SelectItem>
            ) : null}
            {eligibleAunties.map((auntie) => (
              <SelectItem
                key={auntie.id}
                textValue={`${auntie.name} ${auntie.role}`}
                value={auntie.id}
              >
                <AuntieSelectLabel auntie={auntie} showStatus />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {enableReviews && reviewTarget ? (
        <Button
          className="mt-2 h-8 rounded-md px-2.5 text-xs"
          onClick={() => startViewReviews(reviewTarget)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChatCircleText size={14} weight="bold" />
          查看 {reviewTarget.name} 的历史评价
        </Button>
      ) : null}

      <AuntieReviewsDialog
        auntieName={reviewAuntie?.name ?? ""}
        completedCount={reviewAuntie?.completedCount ?? 0}
        isLoading={isReviewLoading}
        onOpenChange={(open) => {
          if (!open) {
            setReviewAuntie(null)
            setReviews([])
          }
        }}
        onPageChange={handleReviewPageChange}
        onPageSizeChange={handleReviewPageSizeChange}
        open={Boolean(reviewAuntie)}
        page={reviewPage}
        pageSize={reviewPageSize}
        rating={reviewAuntie?.rating ?? 0}
        reviews={reviews}
        totalCount={reviewTotalCount}
        totalPages={reviewTotalPages}
      />
    </>
  )
}

function AuntieSelectLabel({
  auntie,
  showStatus = false,
}: {
  auntie: CmsTeamMember
  showStatus?: boolean
}) {
  const avatarSrc = getAuntieAvatarSrc(auntie)

  return (
    <span className="flex min-w-0 items-center gap-2">
      {avatarSrc ? (
        <img
          alt=""
          className="size-6 shrink-0 rounded-full object-cover"
          loading="lazy"
          src={avatarSrc}
        />
      ) : (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          {auntie.name.charAt(0)}
        </span>
      )}
      <span className="truncate">{auntie.name}</span>
      {showStatus ? (
        <span className="text-xs text-muted-foreground">{auntie.role}</span>
      ) : null}
      {auntie.rating > 0 ? (
        <span className="ml-auto flex items-center gap-0.5 text-xs text-amber-500">
          <Star size={11} weight="fill" />
          {auntie.rating.toFixed(1)}
        </span>
      ) : null}
    </span>
  )
}

export { AuntieAssignmentSelect, type AuntieAssignmentChange }
