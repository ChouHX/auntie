import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import {
  CheckCircle,
  CreditCard,
  LockKey,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react"
import { motion, type Variants } from "motion/react"
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  fetchPaymentOrder,
  startPaymentOrderCheckout,
  syncPaymentOrder,
} from "@/lib/cms-api"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n, type Language } from "@/lib/i18n"
import { saveLocalPaymentOrder } from "@/lib/local-orders"
import { getSiteLogo } from "@/lib/site-settings"
import type { CmsPaymentOrder, CmsPaymentOrderAmountItem } from "@/types/cms"

type PaymentOrder = {
  airwallexPaymentIntentId?: string
  amount: string
  amountBreakdown: CmsPaymentOrderAmountItem[]
  amountValue: number
  airwallexPaymentUrl?: string
  baseAmountValue: number
  contact: string
  gatewayStatus?: string
  customerName: string
  note: string
  orderId: string
  paymentType: string
  serviceAddress: string
  serviceArea: string
  serviceDate: string
  serviceType: string
  status: CmsPaymentOrder["status"]
  tipAmount: number
}

type PaymentCopy = {
  baseAmount: string
  backHome: string
  closeReceipt: string
  contactSupport: string
  exclusiveMissing: string
  exclusiveMissingHelp: string
  fields: Record<
    keyof Omit<
      PaymentOrder,
      | "airwallexPaymentIntentId"
      | "airwallexPaymentUrl"
      | "amountBreakdown"
      | "amountValue"
      | "baseAmountValue"
      | "gatewayStatus"
      | "status"
      | "tipAmount"
    >,
    string
  >
  linkRequiredDescription: string
  linkRequiredTitle: string
  payButton: string
  paymentNotice: string
  paymentFormLoading: string
  paymentFormRetry: string
  paymentFormUnavailable: string
  paymentConfirmRetry: string
  paymentConfirmationPending: string
  paymentFailed: string
  paymentOrderExpiredDescription: string
  paymentOrderExpiredTitle: string
  paymentMethodLabel: string
  paymentSummaryTitle: string
  paymentType: string
  policyLinksLabel: string
  policyPrivacy: string
  policyTerms: string
  policyRefund: string
  policyDelivery: string
  policyNotice: string
  processingPayment: string
  receiptDescription: string
  receiptTitle: string
  reviewNotice: string
  secureTitle: string
  tipAmount: string
  tipDescription: string
  tipPlaceholder: string
  tipValidationMessage: string
  totalAmount: string
  confirmPayment: string
  confirmPaymentDescription: string
  successDescription: string
  successTitle: string
  viewReceipt: string
}

const paymentCopy: Record<Language, PaymentCopy> = {
  zh: {
    baseAmount: "基础费用",
    backHome: "返回首页",
    closeReceipt: "关闭",
    contactSupport: "联系客服",
    exclusiveMissing: "未找到这个订单号的付款信息",
    exclusiveMissingHelp:
      "请核对客服发送的链接，或联系客服重新发送专属付款链接。",
    fields: {
      amount: "已确认金额",
      contact: "联系方式",
      customerName: "客户姓名",
      note: "备注信息",
      orderId: "订单编号",
      paymentType: "付款类型",
      serviceAddress: "详细地址",
      serviceArea: "服务城市 / 区域",
      serviceDate: "服务日期",
      serviceType: "服务类型",
    },
    linkRequiredDescription:
      "付款入口不会在官网公开展示。请打开客服在企业微信、电话或邮件中发送的 /checkout?order=ORD20260629AB12 专属链接。",
    linkRequiredTitle: "请使用客服发送的专属付款链接",
    payButton: "确认金额并付款",
    paymentFormLoading: "正在加载安全支付表单...",
    paymentFormRetry: "重新加载支付表单",
    paymentFormUnavailable: "支付表单暂时无法加载，请稍后重试。",
    paymentConfirmRetry: "重新确认支付结果",
    paymentConfirmationPending:
      "支付已提交，支付平台仍在确认结果。请勿重复付款，可以稍后重新确认。",
    paymentFailed: "支付未完成，请重新加载支付表单后再试。",
    paymentOrderExpiredDescription:
      "该订单未在规定时间内完成付款，已自动取消。如需继续预约，请返回首页重新提交预约。",
    paymentOrderExpiredTitle: "付款订单已超时取消",
    paymentNotice:
      "本次付款由国内最大跨境支付平台Airwallex（空中云汇）安全支付系统处理，陈阿姨到家无法保存您的完整银行卡号、CVV 或安全验证码，仅保留订单服务所需信息用于预约确认与售后跟进。",
    paymentMethodLabel: "付款方式",
    paymentSummaryTitle: "付款明细",
    paymentType: "订单付款",
    policyLinksLabel: "相关政策",
    policyPrivacy: "隐私政策",
    policyTerms: "服务条款",
    policyRefund: "取消与退款政策",
    policyDelivery: "服务履约说明",
    policyNotice:
      "清洁服务属于上门服务，服务完成后通常不支持无理由退款。如有问题请在 48 小时内联系客服。",
    processingPayment: "正在确认支付结果...",
    receiptDescription: "以下为本次服务订单的付款明细。",
    receiptTitle: "账单信息",
    reviewNotice: "提交服务评价",
    secureTitle: "安全付款",
    tipAmount: "小费",
    tipDescription: "请填写小费金额；如不打赏，请填写 0。",
    tipPlaceholder: "0.00",
    tipValidationMessage: "请填写 0 - 1000 之间的小费金额。",
    totalAmount: "确认支付金额",
    confirmPayment: "确认金额并进入安全付款",
    confirmPaymentDescription: "请核对以上金额，确认后将进入安全付款界面。",
    successDescription:
      "感谢您的付款。我们已收到您的服务款项。后续如有服务反馈或售后问题，可以通过客服联系我们。",
    successTitle: "支付成功",
    viewReceipt: "查看账单",
  },
  en: {
    baseAmount: "Service total",
    backHome: "Back home",
    closeReceipt: "Close",
    contactSupport: "Contact support",
    exclusiveMissing: "Payment information was not found for this order",
    exclusiveMissingHelp:
      "Please check the link sent by support, or contact support to resend the dedicated payment link.",
    fields: {
      amount: "Confirmed amount",
      contact: "Contact",
      customerName: "Customer name",
      note: "Notes",
      orderId: "Order number",
      paymentType: "Payment type",
      serviceAddress: "Detailed address",
      serviceArea: "Service city / area",
      serviceDate: "Service date",
      serviceType: "Service type",
    },
    linkRequiredDescription:
      "The payment entry is not publicly shown on the website. Please open the dedicated /checkout?order=ORD20260629AB12 link sent by support through WeCom, phone, or email.",
    linkRequiredTitle: "Use the dedicated link sent by support",
    payButton: "Confirm amount and pay",
    paymentFormLoading: "Loading secure payment form...",
    paymentFormRetry: "Reload payment form",
    paymentFormUnavailable:
      "The payment form is temporarily unavailable. Please try again later.",
    paymentConfirmRetry: "Check payment result again",
    paymentConfirmationPending:
      "Payment has been submitted and is still being confirmed. Do not pay again; you can check the result again shortly.",
    paymentFailed:
      "The payment was not completed. Reload the payment form and try again.",
    paymentOrderExpiredDescription:
      "This order was not paid within the allowed time and has been cancelled. Return home to submit a new booking.",
    paymentOrderExpiredTitle: "Payment order expired",
    paymentNotice:
      "Payment is handled through a secure payment channel. Auntie Chen Home does not store your card information.",
    paymentMethodLabel: "Payment Method",
    paymentSummaryTitle: "Payment Details",
    paymentType: "Order payment",
    policyLinksLabel: "Policies",
    policyPrivacy: "Privacy Policy",
    policyTerms: "Terms of Service",
    policyRefund: "Cancellation & Refund",
    policyDelivery: "Service Delivery",
    policyNotice:
      "Cleaning is an on-site service. After service is completed, no-reason refunds are usually not supported. Contact support within 48 hours if there is an issue.",
    processingPayment: "Confirming payment result...",
    receiptDescription: "Payment details for this service order.",
    receiptTitle: "Billing Details",
    reviewNotice: "Submit service review",
    secureTitle: "Secure payment",
    tipAmount: "Tip",
    tipDescription:
      "Enter a tip amount. Enter 0 if you do not wish to add a tip.",
    tipPlaceholder: "0.00",
    tipValidationMessage: "Enter a tip amount from 0 to 1000.",
    totalAmount: "Payment total",
    confirmPayment: "Confirm amount and continue",
    confirmPaymentDescription:
      "Review the amount above. The secure payment page opens after confirmation.",
    successDescription:
      "Thank you for your payment. We have received your service payment. For service feedback or after-service questions, contact support.",
    successTitle: "Payment Successful",
    viewReceipt: "View receipt",
  },
}

const lastPaymentOrderStorageKey = "auntie-chen-last-payment-order"
const airwallexSdkScriptSrc =
  "https://static.airwallex.com/components/sdk/v1/index.js"
const paymentCompletionPollDelaysMs = [0, 1000, 2000, 3000, 5000, 8000, 13000]
const paymentOrderSyncIntervalMs = 3500
type AirwallexEmbeddedEnvironment = "demo" | "prod"

type AirwallexDropInIntent = {
  amount: number
  clientSecret: string
  currency: string
  environment: AirwallexEmbeddedEnvironment
  id: string
}

type AirwallexElement = {
  destroy?: () => void
  mount: (containerId: string) => void
  on?: (eventName: string, handler: (event?: unknown) => void) => void
  unmount?: () => void
}

type AirwallexComponentsSdk = {
  createElement: (
    elementType: "dropIn",
    options: {
      applePayRequestOptions?: {
        countryCode: string
      }
      autoCapture?: boolean
      client_secret: string
      currency: string
      googlePayRequestOptions?: {
        billingAddressRequired?: boolean
        countryCode: string
        merchantInfo?: {
          merchantName: string
        }
      }
      intent_id: string
      mode?: "payment"
      withBilling?: boolean
    }
  ) => AirwallexElement | Promise<AirwallexElement>
  init: (options: {
    enabledElements: string[]
    env: AirwallexEmbeddedEnvironment
    locale?: string
  }) => Promise<void> | void
}

declare global {
  interface Window {
    AirwallexComponentsSDK?: AirwallexComponentsSdk
  }
}

let airwallexSdkPromise: Promise<AirwallexComponentsSdk> | null = null
let airwallexSdkInitKey = ""
let airwallexSdkInitPromise: Promise<void> | null = null
type PaymentCheckoutResult = Awaited<
  ReturnType<typeof startPaymentOrderCheckout>
>
const paymentCheckoutPromises = new Map<
  string,
  Promise<PaymentCheckoutResult>
>()

function PaymentPage() {
  const { dict, language } = useI18n()
  const { content } = useCmsContent(["siteSettings"])
  const copy = paymentCopy[language]
  const logoImage = getSiteLogo(content)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rawOrderId = searchParams.get("order")
  const shouldSyncOrder = searchParams.get("sync") === "1"
  const orderId = rawOrderId ? normalizeOrderId(rawOrderId) : ""
  const [remoteOrder, setRemoteOrder] = useState<
    PaymentOrder | null | undefined
  >(undefined)
  const activeRemoteOrder =
    normalizeOrderId(remoteOrder?.orderId ?? "") === orderId
      ? remoteOrder
      : null
  const handleOrderUpdate = useCallback(
    (order: CmsPaymentOrder) => {
      saveLocalPaymentOrder(order)
      setRemoteOrder(toPaymentOrder(order, copy.paymentType))
    },
    [copy.paymentType, setRemoteOrder]
  )
  const exclusiveOrder = activeRemoteOrder
  const isLoadingOrder = Boolean(orderId) && remoteOrder === undefined

  useEffect(() => {
    if (orderId || !shouldSyncOrder || typeof window === "undefined") {
      return
    }

    const storedOrderId = normalizeOrderId(
      window.sessionStorage.getItem(lastPaymentOrderStorageKey) ?? ""
    )

    if (!storedOrderId) {
      return
    }

    navigate(`/checkout?order=${encodeURIComponent(storedOrderId)}&sync=1`, {
      replace: true,
    })
  }, [navigate, orderId, shouldSyncOrder])

  useEffect(() => {
    let isMounted = true

    if (!orderId) {
      return () => {
        isMounted = false
      }
    }

    fetchPaymentOrder(orderId)
      .then((order) => {
        if (!isMounted) {
          return
        }

        saveLocalPaymentOrder(order)
        setRemoteOrder(toPaymentOrder(order, copy.paymentType))
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setRemoteOrder(null)
      })

    return () => {
      isMounted = false
    }
  }, [copy.paymentType, orderId])

  useEffect(() => {
    let isMounted = true
    const hasCheckoutSession = Boolean(
      activeRemoteOrder?.airwallexPaymentIntentId ||
      activeRemoteOrder?.airwallexPaymentUrl
    )
    const shouldPoll =
      hasCheckoutSession &&
      activeRemoteOrder?.status !== "paid" &&
      activeRemoteOrder?.status !== "failed" &&
      activeRemoteOrder?.status !== "cancelled"
    const shouldSync = shouldSyncOrder || shouldPoll
    let isSyncing = false
    let intervalId: number | undefined

    if (!orderId || !shouldSync || activeRemoteOrder?.status === "paid") {
      return () => {
        isMounted = false
      }
    }

    async function syncOnce() {
      if (!isMounted || isSyncing) {
        return
      }

      isSyncing = true
      try {
        const result = await syncPaymentOrder(orderId)

        if (!isMounted || !result.order) {
          return
        }

        saveLocalPaymentOrder(result.order)
        setRemoteOrder(toPaymentOrder(result.order, copy.paymentType))
      } catch {
        // The checkout page should keep polling; transient sync failures should not
        // return the customer to an empty payment form.
      } finally {
        isSyncing = false
      }
    }

    function syncWhenVisible() {
      if (typeof document !== "undefined" && document.hidden) {
        return
      }

      void syncOnce()
    }

    syncWhenVisible()

    if (shouldPoll && typeof window !== "undefined") {
      intervalId = window.setInterval(
        syncWhenVisible,
        paymentOrderSyncIntervalMs
      )
      window.addEventListener("focus", syncWhenVisible)
      document.addEventListener("visibilitychange", syncWhenVisible)
    }

    return () => {
      isMounted = false
      if (typeof intervalId === "number") {
        window.clearInterval(intervalId)
      }
      window.removeEventListener("focus", syncWhenVisible)
      document.removeEventListener("visibilitychange", syncWhenVisible)
    }
  }, [
    activeRemoteOrder?.airwallexPaymentIntentId,
    activeRemoteOrder?.airwallexPaymentUrl,
    activeRemoteOrder?.status,
    copy.paymentType,
    orderId,
    shouldSyncOrder,
  ])

  useEffect(() => {
    if (activeRemoteOrder?.status !== "paid" || typeof window === "undefined") {
      return
    }

    window.sessionStorage.removeItem(lastPaymentOrderStorageKey)
  }, [activeRemoteOrder?.status])

  return (
    <section
      data-scroll-reveal="false"
      className="min-h-screen bg-slate-100 py-0 transition-colors duration-300 md:py-6 dark:bg-slate-950"
    >
      <div className="mx-auto flex min-h-screen max-w-6xl items-start justify-center px-0 md:min-h-[calc(100vh-3rem)] md:items-center md:px-6 lg:px-8">
        {orderId ? (
          isLoadingOrder && !exclusiveOrder ? (
            <PaymentProcessingState
              brandName={dict.common.brandName}
              copy={copy}
              logoImage={logoImage}
            />
          ) : activeRemoteOrder?.status === "cancelled" ? (
            <ExpiredPaymentOrderCard
              brandName={dict.common.brandName}
              copy={copy}
              logoImage={logoImage}
              orderId={activeRemoteOrder.orderId}
            />
          ) : exclusiveOrder ? (
            <ExclusiveOrderCard
              brandName={dict.common.brandName}
              copy={copy}
              language={language}
              logoImage={logoImage}
              onOrderUpdate={handleOrderUpdate}
              order={exclusiveOrder}
            />
          ) : (
            <MissingOrderCard
              brandName={dict.common.brandName}
              copy={copy}
              logoImage={logoImage}
              orderId={orderId}
            />
          )
        ) : (
          <PaymentLinkRequiredCard
            brandName={dict.common.brandName}
            copy={copy}
            logoImage={logoImage}
          />
        )}
      </div>
    </section>
  )
}

function ExclusiveOrderCard({
  brandName,
  copy,
  language,
  logoImage,
  onOrderUpdate,
  order,
}: {
  brandName: string
  copy: PaymentCopy
  language: Language
  logoImage: string
  onOrderUpdate: (order: CmsPaymentOrder) => void
  order: PaymentOrder
}) {
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(
    Boolean(order.airwallexPaymentIntentId) || order.status === "pending"
  )
  const [confirmedTipAmount, setConfirmedTipAmount] = useState(order.tipAmount)
  const paidOrder = order.status === "paid" ? order : null
  const isPaid = Boolean(paidOrder)
  const needsPaymentConfirmation =
    !isPaymentConfirmed &&
    order.status === "unpaid" &&
    !order.airwallexPaymentIntentId
  const receiptDialog = (
    <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.receiptTitle}</DialogTitle>
          <DialogDescription>{copy.receiptDescription}</DialogDescription>
        </DialogHeader>
        {paidOrder ? (
          <OrderSummary
            className="max-w-none border-0 shadow-none"
            copy={copy}
            includeIdentity
            order={paidOrder}
          />
        ) : null}
        <DialogFooter>
          <Button onClick={() => setIsReceiptOpen(false)} variant="brand">
            {copy.closeReceipt}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (isPaid) {
    return (
      <div className="w-full max-w-xl">
        <PaymentSuccessPanel
          brandName={brandName}
          copy={copy}
          logoImage={logoImage}
          order={paidOrder ?? order}
          onOpenReceipt={() => setIsReceiptOpen(true)}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button
            className="h-10 rounded-lg"
            onClick={() => setIsReceiptOpen(true)}
            variant="brand"
          >
            <CreditCard weight="fill" />
            {copy.viewReceipt}
          </Button>
          <Button asChild className="h-10 rounded-lg" variant="outline">
            <Link to="/after-sales">{copy.reviewNotice}</Link>
          </Button>
        </div>
        {receiptDialog}
      </div>
    )
  }

  return (
    <div className="grid w-full overflow-hidden border-y border-slate-200 bg-white shadow-xl shadow-slate-300/30 md:rounded-2xl md:border md:shadow-2xl md:shadow-slate-300/40 lg:min-h-[38rem] lg:grid-cols-[minmax(19rem,0.9fr)_minmax(0,1.1fr)] dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40">
      <aside className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 p-4 text-slate-950 md:gap-6 md:p-7 lg:border-r lg:border-b-0 lg:p-8 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-white">
        <div className="flex items-center justify-between gap-4">
          <CheckoutBrandHeader
            brandName={brandName}
            logoImage={logoImage}
            subtitle={copy.secureTitle}
          />
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-700 shadow-sm md:size-9 dark:border-white/10 dark:bg-white/8 dark:text-blue-200">
            <LockKey size={17} weight="bold" />
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {copy.fields.amount}
          </p>
          <div className="mt-1 text-3xl font-normal tracking-tight text-slate-950 md:mt-2 md:text-5xl dark:text-white">
            {order.amount}
          </div>
          <div className="mt-3 inline-flex max-w-full items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs text-blue-800 dark:border-white/10 dark:bg-white/8 dark:text-blue-100">
            <span className="truncate">
              {order.serviceType} · {order.serviceDate}
            </span>
          </div>
        </div>

        {!needsPaymentConfirmation ? (
          <PaymentAmountBreakdown copy={copy} order={order} />
        ) : null}

        <div className="hidden lg:block">
          <CheckoutOrderSummary copy={copy} order={order} />
        </div>

        <MobileCheckoutOrderDetails copy={copy} order={order} />

        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {copy.paymentNotice}
        </p>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {copy.policyNotice}
        </p>
        <CheckoutPolicyLinks copy={copy} />
      </aside>

      <div className="flex min-h-[28rem] flex-col justify-start bg-white px-4 py-5 md:min-h-[32rem] md:justify-center md:px-8 md:py-6 lg:px-10 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 lg:hidden dark:border-white/10">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-white">
            <CreditCard size={18} weight="fill" />
            {copy.paymentMethodLabel}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <LockKey size={13} weight="bold" />
            {copy.secureTitle}
          </span>
        </div>
        {needsPaymentConfirmation ? (
          <PaymentConfirmationPanel
            copy={copy}
            onConfirm={(tipAmount) => {
              setConfirmedTipAmount(tipAmount)
              setIsPaymentConfirmed(true)
            }}
            order={order}
          />
        ) : (
          <AirwallexDropInPayment
            copy={copy}
            language={language}
            onOrderUpdate={onOrderUpdate}
            order={order}
            tipAmount={confirmedTipAmount || order.tipAmount}
          />
        )}
      </div>

      {receiptDialog}
    </div>
  )
}

function PaymentConfirmationPanel({
  copy,
  onConfirm,
  order,
}: {
  copy: PaymentCopy
  onConfirm: (tipAmount: number) => void
  order: PaymentOrder
}) {
  const [tipInput, setTipInput] = useState("")
  const parsedTipAmount = tipInput.trim() ? Number(tipInput) : 0
  const isTipValid =
    tipInput.trim() !== "" &&
    Number.isFinite(parsedTipAmount) &&
    parsedTipAmount >= 0 &&
    parsedTipAmount <= 1000
  const baseAmountValue = getBasePaymentAmount(order)
  const totalAmount = baseAmountValue + (isTipValid ? parsedTipAmount : 0)

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-base font-semibold text-slate-950 dark:text-white">
        {copy.paymentSummaryTitle}
      </div>
      <div className="mt-3">
        <PaymentAmountBreakdown copy={copy} order={order} />
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-950 dark:text-white">
        {copy.tipAmount}
        <Input
          className="mt-2 h-10 rounded-md"
          inputMode="decimal"
          max="1000"
          min="0"
          onChange={(event) => setTipInput(event.target.value)}
          placeholder={copy.tipPlaceholder}
          required
          type="number"
          value={tipInput}
        />
      </label>
      <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {copy.tipDescription}
      </p>
      {!isTipValid ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-300">
          {copy.tipValidationMessage}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {copy.totalAmount}
        </span>
        <span className="text-xl font-semibold text-slate-950 dark:text-white">
          {formatPaymentAmount(totalAmount, order.amount)}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {copy.confirmPaymentDescription}
      </p>
      <Button
        className="mt-4 h-10 w-full rounded-lg"
        disabled={!isTipValid}
        onClick={() => onConfirm(Number(parsedTipAmount.toFixed(2)))}
        type="button"
        variant="brand"
      >
        <CreditCard weight="fill" />
        {copy.confirmPayment}
      </Button>
    </div>
  )
}

function PaymentAmountBreakdown({
  copy,
  order,
}: {
  copy: PaymentCopy
  order: PaymentOrder
}) {
  const baseAmountValue = getBasePaymentAmount(order)
  const items = order.amountBreakdown.length
    ? order.amountBreakdown
    : [{ amount: baseAmountValue, label: copy.baseAmount }]

  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="divide-y divide-slate-100 dark:divide-white/10">
        {items.map((item, index) => (
          <div
            className="flex items-center justify-between gap-4 px-3 py-2 text-xs"
            key={`${item.label}-${index}`}
          >
            <span className="min-w-0 truncate text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
            <span className="shrink-0 font-medium text-slate-900 dark:text-white">
              {formatPaymentAmount(item.amount, order.amount)}
            </span>
          </div>
        ))}
        {order.tipAmount > 0 ? (
          <div className="flex items-center justify-between gap-4 px-3 py-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {copy.tipAmount}
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {formatPaymentAmount(order.tipAmount, order.amount)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function getBasePaymentAmount(order: PaymentOrder) {
  if (Number.isFinite(order.baseAmountValue) && order.baseAmountValue >= 0) {
    return order.baseAmountValue
  }

  const breakdownTotal = order.amountBreakdown.reduce(
    (sum, item) => sum + item.amount,
    0
  )

  return breakdownTotal || Math.max(0, order.amountValue - order.tipAmount)
}

function formatPaymentAmount(value: number, fallbackAmount: string) {
  const prefix = fallbackAmount.trim().match(/[^\d.,\s-]+/)?.[0] ?? "$"

  return `${prefix}${value.toFixed(2)}`
}

function AirwallexDropInPayment({
  copy,
  language,
  onOrderUpdate,
  order,
  tipAmount,
}: {
  copy: PaymentCopy
  language: Language
  onOrderUpdate: (order: CmsPaymentOrder) => void
  order: PaymentOrder
  tipAmount: number
}) {
  const containerId = `airwallex-dropin-${normalizeOrderId(
    order.orderId
  ).toLowerCase()}`
  const [error, setError] = useState("")
  const [hasSubmittedPayment, setHasSubmittedPayment] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryKey, setRetryKey] = useState(0)
  const mountGenerationRef = useRef(0)

  useEffect(() => {
    const generation = mountGenerationRef.current + 1

    mountGenerationRef.current = generation
    let isActive = true
    let paymentSubmitted = false
    let dropInElement: AirwallexElement | null = null
    const isCurrentMount = () =>
      isActive && mountGenerationRef.current === generation
    const handlePaymentSubmitted = () => {
      if (!isCurrentMount() || paymentSubmitted) {
        return
      }

      paymentSubmitted = true
      setError("")
      setIsCompleting(true)
      setIsLoading(false)
      setHasSubmittedPayment(true)
      replaceCheckoutUrlWithSync(order.orderId)
    }

    async function mountDropIn() {
      try {
        const result = await getPaymentCheckout(order.orderId, tipAmount)

        if (!isCurrentMount()) {
          return
        }

        onOrderUpdate(result.order)

        if (!result.paymentIntent) {
          return
        }

        window.sessionStorage.setItem(lastPaymentOrderStorageKey, order.orderId)

        const sdk = await loadAirwallexSdk()

        if (!isCurrentMount()) {
          return
        }

        await initializeAirwallexSdk(
          sdk,
          result.paymentIntent.environment,
          language === "zh" ? "zh" : "en"
        )

        if (!isCurrentMount()) {
          return
        }

        dropInElement = await createAirwallexDropInElement(
          sdk,
          result.paymentIntent
        )

        if (!isCurrentMount()) {
          cleanupAirwallexElement(dropInElement)
          return
        }

        dropInElement.on?.("ready", () => {
          if (isCurrentMount()) {
            setIsLoading(false)
          }
        })
        dropInElement.on?.("success", handlePaymentSubmitted)
        dropInElement.on?.("error", (event) => {
          if (isCurrentMount()) {
            setError(
              getAirwallexEventMessage(event, copy.paymentFormUnavailable)
            )
          }
        })
        dropInElement.mount(containerId)

        if (isCurrentMount()) {
          setIsLoading(false)
        }
      } catch (mountError) {
        if (!isCurrentMount()) {
          return
        }

        setError(
          mountError instanceof Error
            ? mountError.message
            : copy.paymentFormUnavailable
        )
        setIsLoading(false)
      }
    }

    async function syncSubmittedPayment() {
      if (!isCurrentMount()) {
        return
      }

      setIsCompleting(true)
      setError("")
      let resolvedAsPaid = false

      try {
        for (const delayMs of paymentCompletionPollDelaysMs) {
          if (delayMs > 0) {
            await wait(delayMs)
          }

          if (!isCurrentMount()) {
            return
          }

          const result = await syncPaymentOrder(order.orderId)
          const nextStatus = result.order?.status

          if (!isCurrentMount()) {
            return
          }

          if (result.order) {
            onOrderUpdate(result.order)
          }

          if (nextStatus === "paid") {
            resolvedAsPaid = true
            return
          }

          if (nextStatus === "failed" || nextStatus === "cancelled") {
            setHasSubmittedPayment(false)
            throw new Error(copy.paymentFailed)
          }
        }

        if (isCurrentMount()) {
          setError(copy.paymentConfirmationPending)
        }
      } catch (syncError) {
        if (isCurrentMount()) {
          setError(
            syncError instanceof Error
              ? syncError.message
              : copy.paymentFormUnavailable
          )
        }
      } finally {
        if (isCurrentMount() && !resolvedAsPaid) {
          setIsCompleting(false)
        }
      }
    }

    if (hasSubmittedPayment) {
      void syncSubmittedPayment()
    } else {
      void mountDropIn()
    }

    return () => {
      isActive = false
      mountGenerationRef.current += 1
      cleanupAirwallexElement(dropInElement)
    }
  }, [
    containerId,
    copy,
    hasSubmittedPayment,
    language,
    onOrderUpdate,
    order.orderId,
    retryKey,
    tipAmount,
  ])

  return (
    <div className="mx-auto w-full max-w-md">
      {isLoading || isCompleting || hasSubmittedPayment ? (
        <PaymentProcessingState
          compact
          copy={{
            ...copy,
            processingPayment:
              isCompleting || hasSubmittedPayment
                ? copy.processingPayment
                : copy.paymentFormLoading,
          }}
        />
      ) : null}

      {hasSubmittedPayment ? null : (
        <div
          className={
            isLoading || isCompleting ? "pointer-events-none opacity-45" : ""
          }
          id={containerId}
        />
      )}

      {error ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">
            {error}
          </div>
          <Button
            className="h-10 rounded-lg"
            onClick={() => {
              setError("")
              if (hasSubmittedPayment) {
                setIsCompleting(true)
              } else {
                setIsLoading(true)
              }
              setRetryKey((value) => value + 1)
            }}
            type="button"
            variant="outline"
          >
            <CreditCard weight="fill" />
            {hasSubmittedPayment
              ? copy.paymentConfirmRetry
              : copy.paymentFormRetry}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

async function loadAirwallexSdk(): Promise<AirwallexComponentsSdk> {
  if (typeof window === "undefined") {
    throw new Error("Airwallex SDK can only be loaded in the browser.")
  }

  if (window.AirwallexComponentsSDK) {
    return window.AirwallexComponentsSDK
  }

  if (airwallexSdkPromise) {
    return airwallexSdkPromise
  }

  airwallexSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${airwallexSdkScriptSrc}"]`
    )
    const script = existingScript ?? document.createElement("script")

    function handleLoad() {
      if (window.AirwallexComponentsSDK) {
        resolve(window.AirwallexComponentsSDK)
        return
      }

      reject(new Error("Airwallex SDK did not initialize."))
    }

    function handleError() {
      reject(new Error("Airwallex SDK could not be loaded."))
    }

    script.addEventListener("load", handleLoad, { once: true })
    script.addEventListener("error", handleError, { once: true })

    if (!existingScript) {
      script.async = true
      script.src = airwallexSdkScriptSrc
      document.head.appendChild(script)
    }
  })

  return airwallexSdkPromise
}

function getPaymentCheckout(orderId: string, tipAmount: number) {
  const normalizedOrderId = normalizeOrderId(orderId)
  const cacheKey = `${normalizedOrderId}:${tipAmount.toFixed(2)}`
  const cachedPromise = paymentCheckoutPromises.get(cacheKey)

  if (cachedPromise) {
    return cachedPromise
  }

  const checkoutPromise = startPaymentOrderCheckout(orderId, tipAmount).catch(
    (error) => {
      paymentCheckoutPromises.delete(cacheKey)
      throw error
    }
  )

  paymentCheckoutPromises.set(cacheKey, checkoutPromise)
  return checkoutPromise
}

async function initializeAirwallexSdk(
  sdk: AirwallexComponentsSdk,
  environment: AirwallexEmbeddedEnvironment,
  locale: string
) {
  const initKey = `${environment}:${locale}`

  if (airwallexSdkInitPromise && airwallexSdkInitKey === initKey) {
    return airwallexSdkInitPromise
  }

  airwallexSdkInitKey = initKey
  airwallexSdkInitPromise = Promise.resolve(
    sdk.init({
      enabledElements: ["payments"],
      env: environment,
      locale,
    })
  )

  return airwallexSdkInitPromise
}

async function createAirwallexDropInElement(
  sdk: AirwallexComponentsSdk,
  paymentIntent: AirwallexDropInIntent
) {
  const walletCountryCode = getWalletCountryCode(paymentIntent.currency)

  return sdk.createElement("dropIn", {
    applePayRequestOptions: {
      countryCode: walletCountryCode,
    },
    autoCapture: true,
    client_secret: paymentIntent.clientSecret,
    currency: paymentIntent.currency,
    googlePayRequestOptions: {
      billingAddressRequired: false,
      countryCode: walletCountryCode,
      merchantInfo: {
        merchantName: "Auntie Chen",
      },
    },
    intent_id: paymentIntent.id,
    mode: "payment",
    withBilling: false,
  })
}

function cleanupAirwallexElement(element: AirwallexElement | null) {
  try {
    element?.unmount?.()
    element?.destroy?.()
  } catch (cleanupError) {
    console.error("Airwallex drop-in cleanup failed", cleanupError)
  }
}

function getWalletCountryCode(currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase()

  if (normalizedCurrency === "HKD") {
    return "HK"
  }

  if (normalizedCurrency === "CAD") {
    return "CA"
  }

  if (normalizedCurrency === "AUD") {
    return "AU"
  }

  if (normalizedCurrency === "GBP") {
    return "GB"
  }

  return "US"
}

function replaceCheckoutUrlWithSync(orderId: string) {
  if (typeof window === "undefined") {
    return
  }

  const url = new URL(window.location.href)

  url.pathname = "/checkout"
  url.searchParams.set("order", normalizeOrderId(orderId))
  url.searchParams.set("sync", "1")
  window.history.replaceState(window.history.state, "", url)
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, delayMs))
}

function getAirwallexEventMessage(event: unknown, fallback: string) {
  const eventRecord = getRecord(event)
  const detailRecord = getRecord(eventRecord.detail)
  const directErrorRecord = getRecord(eventRecord.error)
  const detailErrorRecord = getRecord(detailRecord.error)
  const errorRecord = Object.keys(directErrorRecord).length
    ? directErrorRecord
    : detailErrorRecord

  return (
    getString(eventRecord.message) ||
    getString(detailRecord.message) ||
    getString(errorRecord.message) ||
    fallback
  )
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {}
}

function getString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function PaymentSuccessPanel({
  brandName,
  copy,
  logoImage,
  order,
  onOpenReceipt,
}: {
  brandName: string
  copy: PaymentCopy
  logoImage: string
  order: PaymentOrder
  onOpenReceipt: () => void
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <CheckoutBrandHeader
        brandName={brandName}
        className="mb-4"
        logoImage={logoImage}
        subtitle={copy.secureTitle}
      />
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ scale: 1, rotate: 0 }}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
          initial={{ scale: 0.72, rotate: -8 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <CheckCircle size={21} weight="fill" />
        </motion.div>
        <div className="min-w-0">
          <h2 className="text-lg font-medium text-slate-950 dark:text-white">
            {copy.successTitle}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {copy.successDescription}
          </p>
          <div className="mt-3 grid gap-2 rounded-lg border border-emerald-200/80 bg-white/55 p-3 text-sm dark:border-emerald-400/20 dark:bg-white/[0.05]">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">
                {copy.fields.orderId}
              </span>
              <span className="text-right text-slate-900 dark:text-white">
                {order.orderId}
              </span>
            </div>
          </div>
          <button
            className="mt-3 text-sm text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
            onClick={onOpenReceipt}
            type="button"
          >
            {copy.viewReceipt}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function PaymentProcessingState({
  brandName,
  compact = false,
  copy,
  logoImage,
}: {
  brandName?: string
  compact?: boolean
  copy: PaymentCopy
  logoImage?: string
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`${compact ? "mt-5" : "mx-auto w-full max-w-xl"} overflow-hidden rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100`}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {!compact && brandName && logoImage ? (
        <CheckoutBrandHeader
          brandName={brandName}
          className="mb-4"
          logoImage={logoImage}
          subtitle={copy.secureTitle}
        />
      ) : null}
      <div className="flex items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center">
          <motion.span
            animate={{ opacity: [0.28, 0.08, 0.28], scale: [1, 1.55, 1] }}
            className="absolute inset-0 rounded-full bg-blue-500"
            transition={{ duration: 1.3, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            animate={{ y: [0, -2, 0] }}
            className="relative flex size-10 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm dark:bg-blue-500"
            transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
          >
            <CreditCard size={20} weight="fill" />
          </motion.div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{copy.processingPayment}</p>
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2].map((dot) => (
              <motion.span
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.9, 1.15, 0.9] }}
                className="size-1.5 rounded-full bg-current"
                key={dot}
                transition={{
                  delay: dot * 0.16,
                  duration: 0.9,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MissingOrderCard({
  brandName,
  copy,
  logoImage,
  orderId,
}: {
  brandName: string
  copy: PaymentCopy
  logoImage: string
  orderId: string
}) {
  return (
    <Card className="w-full max-w-xl rounded-lg bg-card/86 p-6 shadow-xl shadow-blue-100/60 dark:bg-slate-900/82 dark:shadow-blue-950/24">
      <CheckoutBrandHeader
        brandName={brandName}
        className="mb-6"
        logoImage={logoImage}
        subtitle={copy.secureTitle}
      />
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
          <WarningCircle size={24} weight="fill" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-slate-950 dark:text-white">
            {copy.exclusiveMissing}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {copy.exclusiveMissingHelp}
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
        {copy.fields.orderId}: {orderId}
      </div>
      <div className="mt-4">
        <CheckoutPolicyLinks copy={copy} />
      </div>
      <Button asChild className="mt-6" variant="outline">
        <Link to="/contact">{copy.contactSupport}</Link>
      </Button>
    </Card>
  )
}

function ExpiredPaymentOrderCard({
  brandName,
  copy,
  logoImage,
  orderId,
}: {
  brandName: string
  copy: PaymentCopy
  logoImage: string
  orderId: string
}) {
  return (
    <Card className="w-full max-w-xl rounded-lg bg-card/86 p-6 shadow-xl shadow-blue-100/60 dark:bg-slate-900/82 dark:shadow-blue-950/24">
      <CheckoutBrandHeader
        brandName={brandName}
        className="mb-6"
        logoImage={logoImage}
        subtitle={copy.secureTitle}
      />
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
          <WarningCircle size={24} weight="fill" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-slate-950 dark:text-white">
            {copy.paymentOrderExpiredTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {copy.paymentOrderExpiredDescription}
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
        {copy.fields.orderId}: {orderId}
      </div>
      <Button asChild className="mt-6" variant="brand">
        <Link to="/">{copy.backHome}</Link>
      </Button>
    </Card>
  )
}

function PaymentLinkRequiredCard({
  brandName,
  copy,
  logoImage,
}: {
  brandName: string
  copy: PaymentCopy
  logoImage: string
}) {
  return (
    <Card className="w-full max-w-xl rounded-lg bg-card/86 p-6 shadow-xl shadow-blue-100/60 dark:bg-slate-900/82 dark:shadow-blue-950/24">
      <CheckoutBrandHeader
        brandName={brandName}
        className="mb-6"
        logoImage={logoImage}
        subtitle={copy.secureTitle}
      />
      <div className="flex size-12 items-center justify-center rounded-lg bg-blue-700 text-white dark:bg-blue-500">
        <ShieldCheck size={24} weight="fill" />
      </div>
      <h2 className="mt-5 text-xl font-medium text-slate-950 dark:text-white">
        {copy.linkRequiredTitle}
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {copy.linkRequiredDescription}
      </p>
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
        {copy.policyNotice}
      </div>
      <div className="mt-4">
        <CheckoutPolicyLinks copy={copy} />
      </div>
      <Button asChild className="mt-6" variant="outline">
        <Link to="/contact">{copy.contactSupport}</Link>
      </Button>
    </Card>
  )
}

function CheckoutBrandHeader({
  brandName,
  className = "",
  logoImage,
  subtitle,
}: {
  brandName: string
  className?: string
  logoImage: string
  subtitle?: string
}) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- CMS logo can be an uploaded or external URL. */}
      <img
        alt={`${brandName} Logo`}
        className="size-11 shrink-0 rounded-xl border border-slate-200 bg-white object-cover p-0.5 shadow-sm dark:border-white/10"
        src={logoImage}
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-950 dark:text-white">
          {brandName}
        </div>
        {subtitle ? (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MobileCheckoutOrderDetails({
  copy,
  order,
}: {
  copy: PaymentCopy
  order: PaymentOrder
}) {
  const items = [
    { label: copy.fields.orderId, value: order.orderId },
    { label: copy.fields.customerName, value: order.customerName },
    { label: copy.fields.serviceDate, value: order.serviceDate },
    {
      label: copy.fields.serviceAddress,
      value: formatCheckoutAddress(order),
    },
  ].filter((item) => Boolean(String(item.value).trim()))

  return (
    <Accordion
      className="lg:hidden"
      collapsible
      defaultValue="order-details"
      type="single"
    >
      <AccordionItem
        className="border-slate-200 dark:border-white/10"
        value="order-details"
      >
        <AccordionTrigger className="py-3 text-sm font-medium">
          <span>{copy.paymentSummaryTitle}</span>
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            {items.map((item) => (
              <div
                className="flex items-start justify-between gap-4 text-xs"
                key={item.label}
              >
                <span className="shrink-0 text-slate-500 dark:text-slate-400">
                  {item.label}
                </span>
                <span className="text-right leading-5 break-words text-slate-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function CheckoutOrderSummary({
  copy,
  order,
}: {
  copy: PaymentCopy
  order: PaymentOrder
}) {
  const serviceAddress = formatCheckoutAddress(order)
  const items = [
    { label: copy.fields.orderId, value: order.orderId },
    { label: copy.fields.customerName, value: order.customerName },
    { label: copy.fields.serviceType, value: order.serviceType },
    { label: copy.fields.serviceDate, value: order.serviceDate },
    {
      label: copy.fields.serviceAddress,
      value: serviceAddress,
      valueClassName: "max-w-[14rem] whitespace-normal",
    },
  ].filter((item) => Boolean(String(item.value).trim()))

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="divide-y divide-slate-100 dark:divide-white/10">
        {items.map((item) => (
          <div
            className="flex items-start justify-between gap-4 px-4 py-3"
            key={item.label}
          >
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
            <span
              className={`max-w-[13rem] text-right text-sm leading-5 break-words text-slate-900 dark:text-white ${item.valueClassName ?? ""}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CheckoutPolicyLinks({ copy }: { copy: PaymentCopy }) {
  const links = [
    { label: copy.policyPrivacy, to: "/privacy" },
    { label: copy.policyTerms, to: "/terms" },
    { label: copy.policyRefund, to: "/cancellation-refund" },
    { label: copy.policyDelivery, to: "/service-delivery" },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
      <div className="font-medium text-slate-800 dark:text-slate-100">
        {copy.policyLinksLabel}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {links.map((link) => (
          <Link
            key={link.to}
            className="underline underline-offset-2 transition hover:text-blue-700 dark:hover:text-blue-200"
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function formatCheckoutAddress(order: PaymentOrder) {
  return [order.serviceArea, order.serviceAddress]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ")
}

function OrderSummary({
  className,
  copy,
  includeIdentity = false,
  order,
  variant = "default",
}: {
  className?: string
  copy: PaymentCopy
  includeIdentity?: boolean
  order: PaymentOrder
  variant?: PaymentSummaryProps["variant"]
}) {
  const paymentIconClassName =
    variant === "inverse" ? "text-cyan-300" : "text-blue-700 dark:text-blue-300"
  const identityItems: PaymentSummaryProps["items"] = includeIdentity
    ? [
        { label: copy.fields.orderId, value: order.orderId },
        { label: copy.fields.customerName, value: order.customerName },
      ]
    : []
  const items: PaymentSummaryProps["items"] = [
    ...identityItems,
    { label: copy.fields.contact, value: order.contact },
    { label: copy.fields.serviceArea, value: order.serviceArea },
    { label: copy.fields.serviceAddress, value: order.serviceAddress },
    { label: copy.fields.serviceDate, value: order.serviceDate },
    { label: copy.fields.serviceType, value: order.serviceType },
  ]

  if (order.note) {
    items.push({
      label: copy.fields.note,
      value: order.note,
      valueClassName: "max-w-[17rem] text-right leading-5 whitespace-normal",
    })
  }

  return (
    <PaymentSummary
      className={className}
      methodLabel={copy.paymentMethodLabel}
      paymentMethod={{
        icon: (
          <CreditCard
            className={paymentIconClassName}
            size={18}
            weight="fill"
          />
        ),
        name: order.paymentType,
      }}
      items={items}
      title={copy.paymentSummaryTitle}
      variant={variant}
    />
  )
}

type PaymentSummaryProps = {
  className?: string
  items: {
    label: string
    value: ReactNode
    valueClassName?: string
  }[]
  methodLabel: string
  paymentMethod: {
    icon: ReactNode
    name: string
  }
  title: string
  variant?: "default" | "inverse"
}

function PaymentSummary({
  className,
  items,
  methodLabel,
  paymentMethod,
  title,
  variant = "default",
}: PaymentSummaryProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  }

  const isInverse = variant === "inverse"
  const cardClasses = isInverse
    ? `w-full rounded-xl border border-white/10 bg-white/[0.04] text-white shadow-none ${className ?? ""}`
    : `w-full rounded-xl border border-slate-200 bg-white text-card-foreground shadow-sm dark:border-white/10 dark:bg-slate-900 ${className ?? ""}`
  const headerClasses = isInverse
    ? "flex flex-col border-b border-white/10 px-4 py-3.5"
    : "flex flex-col border-b border-slate-100 px-4 py-3.5 dark:border-white/10"
  const labelClasses = isInverse
    ? "text-sm text-slate-400"
    : "text-sm text-slate-500 dark:text-slate-400"
  const valueClasses = isInverse
    ? "text-right text-sm break-words text-white"
    : "text-right text-sm break-words text-slate-950 dark:text-white"

  return (
    <div className={cardClasses}>
      <div className={headerClasses}>
        <h3 className="text-base leading-none font-medium tracking-tight">
          {title}
        </h3>
      </div>
      <div className="p-4">
        <motion.div
          animate="visible"
          className="space-y-3"
          initial="hidden"
          variants={containerVariants}
        >
          <motion.div
            className="flex items-center justify-between gap-4"
            variants={itemVariants}
          >
            <span className={labelClasses}>{methodLabel}</span>
            <div className="flex min-w-0 items-center gap-2">
              {paymentMethod.icon}
              <span className="truncate text-sm">{paymentMethod.name}</span>
            </div>
          </motion.div>

          {items.map((item) => (
            <motion.div
              className="flex items-start justify-between gap-4"
              key={item.label}
              variants={itemVariants}
            >
              <span className={labelClasses}>{item.label}</span>
              <span className={`${valueClasses} ${item.valueClassName ?? ""}`}>
                {item.value}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function toPaymentOrder(
  order: CmsPaymentOrder,
  paymentType: string
): PaymentOrder {
  return {
    airwallexPaymentIntentId: order.airwallexPaymentIntentId,
    amount: order.amount,
    amountBreakdown: order.amountBreakdown ?? [],
    amountValue: order.amountValue ?? parsePaymentAmount(order.amount),
    airwallexPaymentUrl: order.airwallexPaymentUrl,
    baseAmountValue:
      order.baseAmountValue ??
      order.amountValue ??
      parsePaymentAmount(order.amount),
    contact: order.contact,
    gatewayStatus: order.gatewayStatus,
    customerName: order.customerName,
    note: order.note,
    orderId: order.orderId,
    paymentType,
    serviceAddress: order.serviceAddress ?? "",
    serviceArea: order.serviceArea,
    serviceDate: order.serviceDate,
    serviceType: order.serviceType,
    status: order.status,
    tipAmount: order.tipAmount ?? 0,
  }
}

function parsePaymentAmount(value: string) {
  const amount = Number(
    value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0
  )

  return Number.isFinite(amount) ? amount : 0
}

function normalizeOrderId(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

export { PaymentPage }
