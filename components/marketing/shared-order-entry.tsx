"use client"

import { useEffect, useState } from "react"
import {
  CreditCard,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  fetchPaymentOrder,
  isApiRequestError,
} from "@/lib/cms-api"
import {
  removeLocalPaymentOrder,
  saveLocalPaymentOrder,
} from "@/lib/local-orders"
import { useNavigate } from "@/lib/router-compat"

type LookupStatus = "loading" | "network_error" | "not_found"

function SharedOrderEntry({ orderId }: { orderId: string }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<LookupStatus>("loading")
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true

    fetchPaymentOrder(orderId)
      .then((order) => {
        if (!isMounted) return

        saveLocalPaymentOrder(order)
        let destination = `/checkout?order=${encodeURIComponent(order.orderId)}`
        if (order.status === "unpaid" || order.status === "pending") {
          destination = "/"
        } else if (order.status === "paid" && !order.review) {
          destination = `/review?order=${encodeURIComponent(order.orderId)}`
        }

        navigate(destination, { replace: true })
      })
      .catch((error) => {
        if (!isMounted) return

        if (isApiRequestError(error, 404)) {
          removeLocalPaymentOrder(orderId)
          setStatus("not_found")
          return
        }

        setStatus("network_error")
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt, navigate, orderId])

  const isLoading = status === "loading"

  return (
    <main
      aria-busy={isLoading}
      aria-live="polite"
      className="flex min-h-svh items-center justify-center bg-slate-50 px-4 pt-24 pb-12 text-slate-950 dark:bg-slate-950 dark:text-white"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/8 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/30 sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-white/10">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white dark:bg-blue-500">
            <CreditCard size={22} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">陈阿姨到家</div>
            <div className="mt-0.5 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
              {orderId}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-4">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${isLoading ? "bg-blue-50 text-blue-700 dark:bg-blue-500/12 dark:text-blue-200" : "bg-amber-50 text-amber-600 dark:bg-amber-500/12 dark:text-amber-200"}`}
          >
            {isLoading ? (
              <SpinnerGap className="animate-spin" size={23} weight="bold" />
            ) : (
              <WarningCircle size={23} weight="fill" />
            )}
          </div>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-lg font-semibold">
              {isLoading
                ? "正在读取订单"
                : status === "not_found"
                  ? "订单未找到"
                  : "订单加载失败"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isLoading
                ? "正在核对最新订单状态，请稍候。"
                : status === "not_found"
                  ? "没有找到该订单，请检查订单链接是否正确。"
                  : "暂时无法连接服务器，请检查网络后重试。"}
            </p>
          </div>
        </div>

        {!isLoading ? (
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => {
                setStatus("loading")
                setLoadAttempt((value) => value + 1)
              }}
              variant="brandStrong"
            >
              重新加载
            </Button>
            <Button
              onClick={() => navigate("/", { replace: true })}
              variant="outline"
            >
              返回首页
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  )
}

export { SharedOrderEntry }
