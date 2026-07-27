"use client"

import { CaretLeft, CaretRight, Star } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { PublicAuntieReviewItem } from "@/lib/cms-api"

type AuntieReviewsDialogProps = {
  auntieName: string
  completedCount: number
  isLoading: boolean
  onOpenChange: (open: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  open: boolean
  page: number
  pageSize: number
  rating: number
  reviews: PublicAuntieReviewItem[]
  totalCount: number
  totalPages: number
}

function AuntieReviewsDialog({
  auntieName,
  completedCount,
  isLoading,
  onOpenChange,
  onPageChange,
  onPageSizeChange,
  open,
  page,
  pageSize,
  rating,
  reviews,
  totalCount,
  totalPages,
}: AuntieReviewsDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl gap-3 overflow-visible p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle>{auntieName} 的历史评价</DialogTitle>
          <DialogDescription>
            查看客户对该阿姨的历史评价，评价来自已完成并付款的服务订单。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <Star
              className={cn(
                "size-5",
                rating > 0 ? "text-amber-500" : "text-muted-foreground"
              )}
              weight="fill"
            />
            <div className="text-sm">
              <span className="font-semibold">
                {rating > 0 ? rating.toFixed(1) : "—"}
              </span>
              <span className="ml-2 text-muted-foreground">
                共 {totalCount} 条评价 · 完成 {completedCount} 单
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : reviews.length ? (
            <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              {reviews.map((review, index) => (
                <AuntieReviewCard key={`${review.createdAt}-${index}`} review={review} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              暂无评价
            </div>
          )}

          {!isLoading && reviews.length > 0 ? (
            <ReviewPagination
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
            />
          ) : null}
        </div>

        <DialogFooter>
          <Button
            className="h-8 rounded-md"
            onClick={() => onOpenChange(false)}
            size="sm"
            type="button"
            variant="outline"
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AuntieReviewCard({ review }: { review: PublicAuntieReviewItem }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-foreground">
            {review.customerName || "匿名客户"}
          </span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-3",
                  i < review.rating
                    ? "text-amber-500"
                    : "text-muted-foreground/30"
                )}
                weight="fill"
              />
            ))}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {review.createdAt
            ? new Date(review.createdAt).toLocaleDateString("zh-CN")
            : ""}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {review.serviceType} · {review.serviceArea} · {review.serviceDate}
      </div>
      {review.comment ? (
        <p className="mt-2 text-sm leading-6 text-foreground">{review.comment}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">（客户未留言）</p>
      )}
    </div>
  )
}

type ReviewPaginationProps = {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

function ReviewPagination({
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  totalCount,
  totalPages,
}: ReviewPaginationProps) {
  const start = totalCount ? (page - 1) * pageSize + 1 : 0
  const end = Math.min(page * pageSize, totalCount)
  const canPrevious = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>每页</span>
        <Select
          onValueChange={(value) => onPageSizeChange(Number(value))}
          value={String(pageSize)}
        >
          <SelectTrigger className="h-8 w-[72px] rounded-md px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {[5, 10, 20].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <div>
          第 {start}-{end} 条，共 {totalCount} 条
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="上一页"
            className="size-8 rounded-md"
            disabled={!canPrevious}
            onClick={() => onPageChange(page - 1)}
            size="icon-sm"
            type="button"
            variant="navIcon"
          >
            <CaretLeft size={14} weight="bold" />
          </Button>
          <div className="min-w-14 text-center">
            {page}/{totalPages}
          </div>
          <Button
            aria-label="下一页"
            className="size-8 rounded-md"
            disabled={!canNext}
            onClick={() => onPageChange(page + 1)}
            size="icon-sm"
            type="button"
            variant="navIcon"
          >
            <CaretRight size={14} weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { AuntieReviewsDialog }
export type { AuntieReviewsDialogProps }
