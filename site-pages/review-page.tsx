"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle,
  HouseLine,
  Star,
  WarningCircle,
} from "@phosphor-icons/react"
import { Link, useSearchParams } from "@/lib/router-compat"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AuntieProfilePopover } from "@/components/common/auntie-profile-popover"
import {
  fetchPaymentOrder,
  fetchPublicAuntie,
  isApiRequestError,
  submitOrderReview,
} from "@/lib/cms-api"
import { cn } from "@/lib/utils"
import type { CmsPaymentOrder, CmsTeamMember } from "@/types/cms"

type ReviewState =
  | "loading"
  | "load_error"
  | "not_found"
  | "not_paid"
  | "already_reviewed"
  | "form"
  | "submitting"
  | "success"

function ReviewPage() {
  const [searchParams] = useSearchParams()
  const rawOrderId = searchParams.get("order") ?? ""
  const [order, setOrder] = useState<CmsPaymentOrder | null | undefined>(
    undefined
  )
  const [assignedAuntie, setAssignedAuntie] = useState<CmsTeamMember | null>(
    null
  )
  const [state, setState] = useState<ReviewState>("loading")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const displayState: ReviewState = rawOrderId ? state : "not_found"

  useEffect(() => {
    if (!rawOrderId) {
      return
    }

    let isMounted = true

    fetchPaymentOrder(rawOrderId)
      .then((orderData) => {
        if (!isMounted) return

        setOrder(orderData)

        if (orderData.assignedAuntieId) {
          void fetchPublicAuntie(orderData.assignedAuntieId)
            .then((auntie) => {
              if (isMounted) {
                setAssignedAuntie(auntie)
              }
            })
            .catch(() => {
              if (isMounted) {
                setAssignedAuntie(null)
              }
            })
        } else {
          setAssignedAuntie(null)
        }

        if (orderData.status !== "paid") {
          setState("not_paid")
        } else if (orderData.review) {
          setState("already_reviewed")
        } else {
          setState("form")
        }
      })
      .catch((requestError) => {
        if (!isMounted) return

        setState(
          isApiRequestError(requestError, 404) ? "not_found" : "load_error"
        )
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt, rawOrderId])

  async function handleSubmit() {
    if (rating < 1) {
      setError("请选择评分")
      return
    }
    if (!comment.trim()) {
      setError("请填写评价内容")
      return
    }

    setState("submitting")
    setError("")

    try {
      const result = await submitOrderReview(rawOrderId, rating, comment.trim())
      setOrder(result.order)
      setState("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交评价失败")
      setState("form")
    }
  }

  return (
    <section className="bg-slate-50 pt-[calc(60px+1.5rem)] pb-12 transition-colors duration-300 sm:pt-[calc(60px+2rem)] sm:pb-16 md:pt-[calc(72px+2rem)] dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {displayState === "loading" ? (
          <ReviewLoadingCard />
        ) : displayState === "load_error" ? (
          <ReviewLoadErrorCard
            onRetry={() => {
              setState("loading")
              setOrder(undefined)
              setLoadAttempt((value) => value + 1)
            }}
          />
        ) : displayState === "not_found" ? (
          <ReviewNotFoundCard />
        ) : displayState === "not_paid" ? (
          <ReviewNotPaidCard order={order ?? null} />
        ) : displayState === "already_reviewed" ? (
          <ReviewAlreadyReviewedCard
            order={order ?? null}
            auntie={assignedAuntie}
          />
        ) : displayState === "success" ? (
          <ReviewSuccessCard order={order ?? null} auntie={assignedAuntie} />
        ) : (
          <ReviewFormCard
            comment={comment}
            error={error}
            hoverRating={hoverRating}
            order={order ?? null}
            auntie={assignedAuntie}
            rating={rating}
            setComment={setComment}
            setHoverRating={setHoverRating}
            setRating={setRating}
            onSubmit={handleSubmit}
            isSubmitting={state === "submitting"}
          />
        )}
      </div>
    </section>
  )
}

function ReviewLoadingCard() {
  return (
    <Card className="flex h-64 items-center justify-center border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="text-sm text-slate-400 dark:text-slate-500">
        正在加载订单信息...
      </div>
    </Card>
  )
}

function ReviewLoadErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-4 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
      <WarningCircle size={40} className="text-amber-500" />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          订单加载失败
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          暂时无法连接服务器，请检查网络后重新加载。
        </p>
      </div>
      <Button onClick={onRetry} variant="brand">
        重新加载
      </Button>
    </Card>
  )
}

function ReviewNotFoundCard() {
  return (
    <Card className="flex flex-col items-center gap-4 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
      <WarningCircle size={40} className="text-amber-500" />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          订单未找到
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          请检查链接是否正确，或联系客服获取评价链接。
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/">返回首页</Link>
      </Button>
    </Card>
  )
}

function ReviewNotPaidCard({ order }: { order: CmsPaymentOrder | null }) {
  return (
    <Card className="flex flex-col items-center gap-4 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
      <WarningCircle size={40} className="text-amber-500" />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          订单尚未付款
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          订单 {order?.orderId ?? ""} 尚未完成付款，付款后即可评价。
        </p>
      </div>
      {order ? (
        <Button asChild variant="brand">
          <Link to={`/checkout?order=${encodeURIComponent(order.orderId)}`}>
            前往付款
          </Link>
        </Button>
      ) : null}
    </Card>
  )
}

function ReviewAlreadyReviewedCard({
  order,
  auntie,
}: {
  order: CmsPaymentOrder | null
  auntie: CmsTeamMember | null | undefined
}) {
  const review = order?.review
  return (
    <Card className="flex flex-col items-center gap-4 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
      <CheckCircle size={40} className="text-emerald-500" />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          已完成评价
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          订单 {order?.orderId ?? ""} 已提交过评价，感谢您的反馈！
        </p>
      </div>
      {review ? <ReviewSummary review={review} /> : null}
      {order ? (
        <div className="w-full text-left">
          <OrderInfoSection order={order} auntie={auntie} />
        </div>
      ) : null}
      <Button asChild variant="outline">
        <Link to="/">返回首页</Link>
      </Button>
    </Card>
  )
}

function ReviewSuccessCard({
  order,
  auntie,
}: {
  order: CmsPaymentOrder | null
  auntie: CmsTeamMember | null | undefined
}) {
  return (
    <Card className="flex flex-col items-center gap-4 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
      <CheckCircle size={48} className="text-emerald-500" weight="fill" />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          评价提交成功
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          感谢您的评价！您的反馈将帮助我们持续提升服务质量。
        </p>
      </div>
      {order?.review ? <ReviewSummary review={order.review} /> : null}
      {order ? (
        <div className="w-full text-left">
          <OrderInfoSection order={order} auntie={auntie} />
        </div>
      ) : null}
      <Button asChild variant="brand">
        <Link to="/">
          <HouseLine size={16} />
          返回首页
        </Link>
      </Button>
    </Card>
  )
}

function ReviewSummary({
  review,
}: {
  review: NonNullable<CmsPaymentOrder["review"]>
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-xl bg-slate-50 px-6 py-4 dark:bg-slate-800/50">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            weight={star <= review.rating ? "fill" : "regular"}
            className={cn(
              star <= review.rating
                ? "text-amber-400"
                : "text-slate-300 dark:text-slate-600"
            )}
          />
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {review.comment}
      </p>
    </div>
  )
}

function ReviewFormCard({
  comment,
  error,
  hoverRating,
  order,
  auntie,
  rating,
  setComment,
  setHoverRating,
  setRating,
  onSubmit,
  isSubmitting,
}: {
  comment: string
  error: string
  hoverRating: number
  order: CmsPaymentOrder | null
  auntie: CmsTeamMember | null | undefined
  rating: number
  setComment: (v: string) => void
  setHoverRating: (v: number) => void
  setRating: (v: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  if (!order) return null

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/30">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-slate-800/50">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          服务评价
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          感谢您选择陈阿姨到家，请对本次服务进行评价
        </p>
      </div>

      <div className="space-y-6 p-6">
        <OrderInfoSection order={order} auntie={auntie} />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            服务评分
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`${star} 星`}
              >
                <Star
                  size={32}
                  weight={star <= (hoverRating || rating) ? "fill" : "regular"}
                  className={cn(
                    star <= (hoverRating || rating)
                      ? "text-amber-400"
                      : "text-slate-300 dark:text-slate-600"
                  )}
                />
              </button>
            ))}
            {rating > 0 ? (
              <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                {rating === 5
                  ? "非常满意"
                  : rating === 4
                    ? "满意"
                    : rating === 3
                      ? "一般"
                      : rating === 2
                        ? "不太满意"
                        : "不满意"}
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            评价内容
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请分享您的服务体验..."
            className="min-h-[120px] resize-none"
            maxLength={500}
          />
          <div className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
            {comment.length}/500
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-400/10 dark:text-red-300">
            <WarningCircle size={16} />
            {error}
          </div>
        ) : null}

        <Button
          className="w-full"
          disabled={isSubmitting || rating === 0 || !comment.trim()}
          onClick={onSubmit}
          variant="brand"
        >
          {isSubmitting ? "提交中..." : "提交评价"}
        </Button>
        <Button asChild className="w-full" variant="outline">
          <Link to={`/checkout?order=${encodeURIComponent(order.orderId)}`}>
            暂不评价，查看订单
          </Link>
        </Button>
      </div>
    </Card>
  )
}

function OrderInfoSection({
  order,
  auntie,
}: {
  order: CmsPaymentOrder
  auntie: CmsTeamMember | null | undefined
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-800/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            订单号
          </div>
          <div className="font-mono text-sm font-medium text-slate-900 dark:text-white">
            {order.orderId}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            服务类型
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {order.serviceType}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            服务日期
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {order.serviceDate}
          </div>
        </div>
      </div>
      {auntie ? (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
          <AuntieProfilePopover
            member={auntie}
            showStatusDot={false}
            triggerClassName="size-8"
          />
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {auntie.name}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {auntie.role}
            </span>
            {auntie.rating > 0 ? (
              <span className="ml-auto flex items-center gap-0.5 text-xs text-amber-500">
                <Star size={12} weight="fill" />
                {auntie.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { ReviewPage }
