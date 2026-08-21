import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ArrowLeft,
  CheckCircle,
  Check,
  ClipboardText,
  CreditCard,
  ImageSquare,
  LockKey,
  MapPin,
  ShieldCheck,
  Star,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react"
import { AnimatePresence, motion, type Variants } from "motion/react"
import Image from "next/image"
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  fetchPaymentOrder,
  startPaymentOrderCheckout,
  syncPaymentOrder,
  uploadZellePaymentProof,
  deleteZellePaymentProof,
} from "@/lib/cms-api"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n, type Language } from "@/lib/i18n"
import { saveLocalPaymentOrder } from "@/lib/local-orders"
import { getSiteLogo } from "@/lib/site-settings"
import type {
  CmsPaymentOrder,
  CmsPaymentOrderAmountItem,
  CmsPaymentProof,
} from "@/types/cms"

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
  paymentExpiresAt?: string
  paymentType: string
  serviceAddress: string
  serviceArea: string
  serviceDate: string
  serviceType: string
  status: CmsPaymentOrder["status"]
  tipAmount: number
  zellePaymentProof?: CmsPaymentProof
  review?: CmsPaymentOrder["review"]
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
      | "paymentExpiresAt"
      | "status"
      | "tipAmount"
      | "zellePaymentProof"
      | "review"
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
  airwallexPaymentMethod: string
  airwallexPaymentMethodDescription: string
  zellePaymentMethod: string
  zellePaymentMethodDescription: string
  choosePaymentMethod: string
  backToTip: string
  backToPaymentMethods: string
  zelleCompanyName: string
  zelleEmail: string
  zellePaymentNote: string
  zellePaymentNoteDescription: string
  zelleUploadTitle: string
  zelleUploadDescription: string
  zelleUploadButton: string
  zelleUploadSuccess: string
  zelleSelectedFile: string
  copyValue: string
  copiedValue: string
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
    tipDescription:
      "阿姨认真完成每一次上门服务。如果您认可她今天的服务，可以给她一点小费作为鼓励吗？小费将 100% 直接给到阿姨。",
    tipPlaceholder: "0.00",
    tipValidationMessage: "请填写 0 - 1000 之间的小费金额。",
    totalAmount: "确认支付金额",
    confirmPayment: "确认金额并进入安全付款",
    confirmPaymentDescription: "请核对以上金额，确认后将进入安全付款界面。",
    airwallexPaymentMethod: "信用卡 / Apple Pay / Google Pay",
    airwallexPaymentMethodDescription: "通过空中云汇安全完成在线付款",
    zellePaymentMethod: "Zelle 付款",
    zellePaymentMethodDescription: "通过 Zelle 转账，并上传付款截图",
    choosePaymentMethod: "请选择付款方式",
    backToTip: "返回小费填写",
    backToPaymentMethods: "返回付款方式",
    zelleCompanyName: "公司名称",
    zelleEmail: "Zelle Email",
    zellePaymentNote: "付款备注",
    zellePaymentNoteDescription:
      "付款时请将订单编号粘贴到付款备注中，方便我们核对订单。如有报账或记录需要，您可以在订单编号后继续添加自己的付款说明。",
    zelleUploadTitle: "上传付款凭证",
    zelleUploadDescription:
      "请从手机相册选择刚刚保存的付款截图。点击后将打开系统图片选择器。",
    zelleUploadButton: "上传付款截图",
    zelleUploadSuccess: "付款凭证已提交，正在进入订单评价。",
    zelleSelectedFile: "已选择",
    copyValue: "复制",
    copiedValue: "已复制",
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
      "Your service professional works hard on every visit. If you appreciate today's service, would you like to leave a tip as encouragement? 100% of the tip goes directly to her.",
    tipPlaceholder: "0.00",
    tipValidationMessage: "Enter a tip amount from 0 to 1000.",
    totalAmount: "Payment total",
    confirmPayment: "Confirm amount and continue",
    confirmPaymentDescription:
      "Review the amount above. The secure payment page opens after confirmation.",
    airwallexPaymentMethod: "Card / Apple Pay / Google Pay",
    airwallexPaymentMethodDescription: "Pay securely online through Airwallex",
    zellePaymentMethod: "Zelle",
    zellePaymentMethodDescription:
      "Send a Zelle transfer and upload your payment screenshot",
    choosePaymentMethod: "Choose a payment method",
    backToTip: "Back to tip",
    backToPaymentMethods: "Back to payment methods",
    zelleCompanyName: "Company name",
    zelleEmail: "Zelle Email",
    zellePaymentNote: "Payment note",
    zellePaymentNoteDescription:
      "Please paste the order number into the payment note so we can match your payment. If you need a reimbursement or record, you may add your own note after the order number.",
    zelleUploadTitle: "Upload payment proof",
    zelleUploadDescription:
      "Choose the payment screenshot from your phone’s photo library. Tapping the button opens the system image picker.",
    zelleUploadButton: "Upload payment screenshot",
    zelleUploadSuccess: "Payment proof submitted. Opening your review.",
    zelleSelectedFile: "Selected",
    copyValue: "Copy",
    copiedValue: "Copied",
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

  useEffect(() => {
    if (activeRemoteOrder?.status !== "paid" || !shouldSyncOrder) {
      return
    }

    navigate(`/review?order=${encodeURIComponent(activeRemoteOrder.orderId)}`, {
      replace: true,
    })
  }, [activeRemoteOrder, navigate, shouldSyncOrder])

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
              key={getPaymentSessionKey(exclusiveOrder)}
              language={language}
              logoImage={logoImage}
              onOrderUpdate={handleOrderUpdate}
              onZelleSubmitted={(submittedOrderId) => {
                window.setTimeout(() => {
                  navigate(
                    `/review?order=${encodeURIComponent(submittedOrderId)}`,
                    { replace: true }
                  )
                }, 900)
              }}
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
  onZelleSubmitted,
  order,
}: {
  brandName: string
  copy: PaymentCopy
  language: Language
  logoImage: string
  onOrderUpdate: (order: CmsPaymentOrder) => void
  onZelleSubmitted: (orderId: string) => void
  order: PaymentOrder
}) {
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<
    "airwallex" | "zelle" | null
  >(order.airwallexPaymentIntentId ? "airwallex" : null)
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(
    Boolean(order.airwallexPaymentIntentId) || order.status === "pending"
  )
  const [confirmedTipAmount, setConfirmedTipAmount] = useState(order.tipAmount)
  const [draftTipAmount, setDraftTipAmount] = useState(order.tipAmount)
  const displayOrder: PaymentOrder = {
    ...order,
    amount: formatPaymentAmount(
      getBasePaymentAmount(order) + draftTipAmount,
      order.amount
    ),
    amountValue: getBasePaymentAmount(order) + draftTipAmount,
    tipAmount: draftTipAmount,
  }
  const paidOrder = order.status === "paid" ? order : null
  const isPaid = Boolean(paidOrder)
  const needsPaymentConfirmation =
    !isPaymentConfirmed &&
    order.status === "unpaid" &&
    !order.airwallexPaymentIntentId
  const paymentStage = needsPaymentConfirmation
    ? "confirmation"
    : (paymentMethod ?? "methods")
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
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/25 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/30">
        <PaymentSuccessPanel
          brandName={brandName}
          copy={copy}
          logoImage={logoImage}
          order={paidOrder ?? order}
        />
        <OrderSummary
          className="mt-0 max-w-none rounded-none border-x-0 border-t-0 border-b shadow-none"
          copy={copy}
          includeIdentity
          order={paidOrder ?? order}
        />
        <div className="border-t border-slate-100 p-4 dark:border-white/10">
          {order.review ? (
            <PaymentReviewSummary className="mt-0" order={order} />
          ) : (
            <Button asChild className="h-11 w-full rounded-lg" variant="brand">
              <Link to={`/review?order=${encodeURIComponent(order.orderId)}`}>
                <Star weight="fill" />
                {copy.reviewNotice}
              </Link>
            </Button>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Button
              className="h-10 rounded-lg"
              onClick={() => setIsReceiptOpen(true)}
              variant="outline"
            >
              <CreditCard weight="fill" />
              {copy.viewReceipt}
            </Button>
            <Button asChild className="h-10 rounded-lg" variant="outline">
              <Link to="/after-sales">{copy.contactSupport}</Link>
            </Button>
          </div>
        </div>
        {receiptDialog}
      </div>
    )
  }

  return (
    <div className="grid w-full overflow-hidden bg-transparent md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-2xl md:shadow-slate-300/40 lg:min-h-[38rem] lg:grid-cols-[minmax(19rem,0.9fr)_minmax(0,1.1fr)] md:dark:border-white/10 md:dark:bg-slate-900 md:dark:shadow-black/40">
      <aside className="flex flex-col gap-2 bg-transparent p-4 text-slate-950 md:gap-6 md:bg-gradient-to-br md:from-slate-50 md:via-white md:to-blue-50/70 md:p-7 lg:border-r lg:border-b-0 lg:border-slate-200 lg:p-8 dark:text-white md:dark:from-slate-900 md:dark:via-slate-900 md:dark:to-slate-800 lg:dark:border-white/10">
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
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 md:mt-2">
            <div className="shrink-0 text-2xl font-semibold tracking-tight text-slate-950 md:text-5xl md:font-normal dark:text-white">
              {displayOrder.amount}
            </div>
            <div className="inline-flex max-w-full min-w-0 shrink-0 items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-800 md:px-3 md:text-xs dark:border-white/10 dark:bg-white/8 dark:text-blue-100">
              <span className="truncate">
                {order.serviceType} · {order.serviceDate}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 lg:hidden">
            <span className="min-w-0 truncate text-[11px] text-slate-500 dark:text-slate-400">
              {copy.fields.orderId}: {order.orderId}
            </span>
            <span className="flex shrink-0 items-center text-slate-500 dark:text-slate-400">
              <PaymentInfoPopover
                copy={copy}
                showPaymentNotice={paymentMethod === "airwallex"}
              />
            </span>
          </div>
        </div>

        {!needsPaymentConfirmation ? (
          <div className="hidden lg:block">
            <PaymentAmountBreakdown copy={copy} order={displayOrder} />
          </div>
        ) : null}

        <div className="hidden lg:block">
          <CheckoutOrderSummary copy={copy} order={displayOrder} />
        </div>

        {paymentMethod === "airwallex" ? (
          <p className="hidden text-xs leading-5 text-slate-500 lg:block dark:text-slate-400">
            {copy.paymentNotice}
          </p>
        ) : null}
        <p className="hidden text-xs leading-5 text-slate-500 lg:block dark:text-slate-400">
          {copy.policyNotice}
        </p>
        <div className="hidden lg:block">
          <CheckoutPolicyLinks copy={copy} />
        </div>
      </aside>

      <div className="flex min-h-0 flex-col justify-start bg-transparent px-4 py-2 md:min-h-[32rem] md:justify-center md:bg-gradient-to-br md:from-slate-50 md:via-white md:to-blue-50/70 md:px-8 md:py-6 lg:bg-white lg:px-10 md:dark:from-slate-900 md:dark:via-slate-900 md:dark:to-slate-800 lg:dark:bg-slate-900">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
            exit={{ opacity: 0, x: -12 }}
            initial={{ opacity: 0, x: 12 }}
            key={paymentStage}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {needsPaymentConfirmation ? (
              <PaymentConfirmationPanel
                copy={copy}
                initialTipAmount={draftTipAmount}
                onConfirm={(tipAmount) => {
                  setConfirmedTipAmount(tipAmount)
                  setDraftTipAmount(tipAmount)
                  setIsPaymentConfirmed(true)
                }}
                onTipChange={setDraftTipAmount}
                order={order}
              />
            ) : paymentMethod === "zelle" ? (
              <ZellePaymentPanel
                copy={copy}
                onBack={() => setPaymentMethod(null)}
                onUploaded={(nextOrder) => onOrderUpdate(nextOrder)}
                onSubmitted={() => onZelleSubmitted(order.orderId)}
                order={order}
              />
            ) : paymentMethod === "airwallex" ? (
              <AirwallexDropInPayment
                copy={copy}
                language={language}
                onBack={() => setPaymentMethod(null)}
                onOrderUpdate={onOrderUpdate}
                order={order}
                tipAmount={confirmedTipAmount}
              />
            ) : (
              <PaymentMethodSelection
                copy={copy}
                onBack={() => {
                  setPaymentMethod(null)
                  setIsPaymentConfirmed(false)
                }}
                onSelect={setPaymentMethod}
                order={order}
                tipAmount={confirmedTipAmount}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {receiptDialog}
    </div>
  )
}

function PaymentConfirmationPanel({
  copy,
  initialTipAmount,
  onConfirm,
  onTipChange,
  order,
}: {
  copy: PaymentCopy
  initialTipAmount: number
  onConfirm: (tipAmount: number) => void
  onTipChange: (tipAmount: number) => void
  order: PaymentOrder
}) {
  const [tipInput, setTipInput] = useState(() =>
    initialTipAmount > 0 ? initialTipAmount.toFixed(2) : ""
  )
  const parsedTipAmount = tipInput.trim() ? Number(tipInput) : 0
  const isTipValid =
    tipInput.trim() !== "" &&
    Number.isFinite(parsedTipAmount) &&
    parsedTipAmount >= 0 &&
    parsedTipAmount <= 1000
  const baseAmountValue = getBasePaymentAmount(order)
  const totalAmount = baseAmountValue + (isTipValid ? parsedTipAmount : 0)
  const confirmationOrder: PaymentOrder = {
    ...order,
    amount: formatPaymentAmount(totalAmount, order.amount),
    amountValue: totalAmount,
    tipAmount: isTipValid ? parsedTipAmount : 0,
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl p-0 lg:border lg:border-slate-200 lg:bg-slate-50/70 lg:p-4 lg:shadow-sm lg:dark:border-white/10 lg:dark:bg-white/[0.04]">
      <div className="text-sm font-semibold text-slate-950 lg:text-base dark:text-white">
        {copy.paymentSummaryTitle}
      </div>
      <div className="mt-3">
        <PaymentAmountBreakdown copy={copy} order={confirmationOrder} />
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.04]">
        <MapPin
          className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
          size={15}
          weight="fill"
        />
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {copy.fields.serviceAddress}
          </div>
          <div className="mt-0.5 leading-5 break-words text-slate-900 dark:text-white">
            {formatCheckoutAddress(order)}
          </div>
        </div>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-950 dark:text-white">
        {copy.tipAmount}
        <Input
          className="mt-2 h-10 rounded-md"
          inputMode="decimal"
          max="1000"
          min="0"
          onChange={(event) => {
            const nextValue = event.target.value
            setTipInput(nextValue)
            const nextAmount = Number(nextValue)
            onTipChange(
              nextValue.trim() !== "" &&
                Number.isFinite(nextAmount) &&
                nextAmount >= 0 &&
                nextAmount <= 1000
                ? Number(nextAmount.toFixed(2))
                : 0
            )
          }}
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
      <p className="mt-3 hidden text-xs leading-5 text-slate-500 lg:block dark:text-slate-400">
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

function PaymentMethodSelection({
  copy,
  onBack,
  onSelect,
  order,
  tipAmount,
}: {
  copy: PaymentCopy
  onBack: () => void
  onSelect: (method: "airwallex" | "zelle") => void
  order: PaymentOrder
  tipAmount: number
}) {
  const totalAmount = getBasePaymentAmount(order) + tipAmount
  const summaryOrder: PaymentOrder = {
    ...order,
    amount: formatPaymentAmount(totalAmount, order.amount),
    amountValue: totalAmount,
    tipAmount,
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl p-0 lg:border lg:border-slate-200 lg:bg-slate-50/70 lg:p-4 lg:shadow-sm lg:dark:border-white/10 lg:dark:bg-white/[0.04]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-950 lg:text-base dark:text-white">
          {copy.paymentSummaryTitle}
        </div>
        <Button
          className="h-8 px-2 text-xs"
          onClick={onBack}
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeft size={14} />
          {copy.backToTip}
        </Button>
      </div>
      <PaymentAmountBreakdown copy={copy} order={summaryOrder} />
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.04]">
        <MapPin
          className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
          size={15}
          weight="fill"
        />
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {copy.fields.serviceAddress}
          </div>
          <div className="mt-0.5 leading-5 break-words text-slate-900 dark:text-white">
            {formatCheckoutAddress(order)}
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-950 lg:text-base dark:text-white">
        {copy.choosePaymentMethod}
      </div>
      <div className="mt-4 grid gap-3">
        <PaymentMethodButton
          description={copy.airwallexPaymentMethodDescription}
          iconAlt="Airwallex"
          iconSrc="/payment/airwallex.svg"
          label={copy.airwallexPaymentMethod}
          onClick={() => onSelect("airwallex")}
        />
        <PaymentMethodButton
          description={copy.zellePaymentMethodDescription}
          iconAlt="Zelle"
          iconSrc="/payment/zelle.svg"
          label={copy.zellePaymentMethod}
          onClick={() => onSelect("zelle")}
        />
      </div>
    </div>
  )
}

function PaymentMethodButton({
  description,
  iconAlt,
  iconSrc,
  label,
  onClick,
}: {
  description: string
  iconAlt: string
  iconSrc: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-blue-400/50 dark:hover:bg-blue-400/10"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm dark:bg-white/90">
        <Image
          alt={iconAlt}
          className="size-full object-contain"
          height={40}
          src={iconSrc}
          width={40}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-950 dark:text-white">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>
    </button>
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
  onBack,
  onOrderUpdate,
  order,
  tipAmount,
}: {
  copy: PaymentCopy
  language: Language
  onBack: () => void
  onOrderUpdate: (order: CmsPaymentOrder) => void
  order: PaymentOrder
  tipAmount: number
}) {
  const navigate = useNavigate()
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
            navigate(`/review?order=${encodeURIComponent(order.orderId)}`, {
              replace: true,
            })
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
    navigate,
    onOrderUpdate,
    order.orderId,
    retryKey,
    tipAmount,
  ])

  return (
    <div className="mx-auto w-full max-w-md">
      <Button
        className="mb-3 h-8 px-2 text-xs"
        onClick={onBack}
        size="sm"
        type="button"
        variant="ghost"
      >
        <ArrowLeft size={14} />
        {copy.backToPaymentMethods}
      </Button>
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

function ZellePaymentPanel({
  copy,
  onBack,
  onSubmitted,
  onUploaded,
  order,
}: {
  copy: PaymentCopy
  onBack: () => void
  onSubmitted: () => void
  onUploaded: (order: CmsPaymentOrder) => void
  order: PaymentOrder
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [selectedScreenshot, setSelectedScreenshot] = useState<File | null>(
    null
  )
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploaded, setUploaded] = useState(Boolean(order.zellePaymentProof))
  const paymentNote = `${order.orderId}`
  const selectedPreviewUrl = useMemo(
    () => (selectedScreenshot ? URL.createObjectURL(selectedScreenshot) : null),
    [selectedScreenshot]
  )

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl)
    }
  }, [selectedPreviewUrl])

  const copyValue = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(null), 1600)
    } catch {
      setCopiedField(null)
    }
  }

  const selectScreenshot = (file: File | null) => {
    setSelectedScreenshot(file)
    setUploadError("")
    setUploadSuccess(false)
  }

  const submitScreenshot = async () => {
    if (!selectedScreenshot) return
    setIsUploading(true)
    try {
      const result = await uploadZellePaymentProof(
        order.orderId,
        selectedScreenshot
      )
      onUploaded(result.order)
      setSelectedScreenshot(null)
      setUploaded(true)
      setUploadSuccess(true)
      onSubmitted()
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "付款凭证上传失败。"
      )
    } finally {
      setIsUploading(false)
    }
  }

  const removeScreenshot = async () => {
    setIsUploading(true)
    setUploadError("")
    setUploadSuccess(false)
    try {
      const result = await deleteZellePaymentProof(order.orderId)
      onUploaded(result.order)
      setUploaded(false)
      setSelectedScreenshot(null)
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "付款凭证删除失败。"
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Button
          className="h-8 px-2 text-xs"
          onClick={onBack}
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeft size={14} />
          {copy.backToPaymentMethods}
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            Zelle
          </span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-white/90 dark:ring-white/10">
            <Image
              alt="Zelle"
              className="size-full object-contain"
              height={32}
              src="/payment/zelle.svg"
              width={32}
            />
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          <CopyablePaymentValue
            copy={copy}
            copied={copiedField === "company"}
            label={copy.zelleCompanyName}
            onCopy={() =>
              void copyValue("company", "AUNTIE CHEN HOME SERVICES INC")
            }
            value="AUNTIE CHEN HOME SERVICES INC"
          />
          <CopyablePaymentValue
            copy={copy}
            copied={copiedField === "email"}
            label={copy.zelleEmail}
            onCopy={() => void copyValue("email", "Yangweioi@163.com")}
            value="Yangweioi@163.com"
          />
          <CopyablePaymentValue
            copy={copy}
            copied={copiedField === "order"}
            label={copy.fields.orderId}
            onCopy={() => void copyValue("order", paymentNote)}
            value={paymentNote}
          />
        </div>
        <p className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
          <strong className="font-semibold text-slate-950 dark:text-white">
            {copy.zellePaymentNote}：
          </strong>{" "}
          {copy.zellePaymentNoteDescription}
        </p>
        <div className="border-t border-slate-200 px-4 py-4 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-950 dark:text-white">
              <ImageSquare size={18} weight="fill" />
              {copy.zelleUploadTitle}
            </div>
            <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
              JPG / PNG
            </span>
          </div>
          <input
            accept="image/*"
            className="sr-only"
            id={`zelle-screenshot-${normalizeOrderId(order.orderId).toLowerCase()}`}
            onChange={(event) => {
              selectScreenshot(event.target.files?.[0] ?? null)
              event.currentTarget.value = ""
            }}
            type="file"
          />
          {!uploaded && !selectedScreenshot ? (
            <label
              className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-white/20 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              htmlFor={`zelle-screenshot-${normalizeOrderId(order.orderId).toLowerCase()}`}
            >
              <UploadSimple size={17} weight="bold" />
              {copy.zelleUploadButton}
            </label>
          ) : null}
          {selectedPreviewUrl ||
          (!selectedScreenshot && uploaded && order.zellePaymentProof) ? (
            <div className="relative mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-black/20">
              <img
                alt={copy.zelleUploadTitle}
                className="max-h-48 w-full object-contain"
                src={selectedPreviewUrl ?? order.zellePaymentProof?.dataUrl}
              />
              <button
                aria-label="删除截图"
                className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-sm transition-colors hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
                disabled={isUploading}
                onClick={() => {
                  if (selectedScreenshot) {
                    setSelectedScreenshot(null)
                    return
                  }
                  void removeScreenshot()
                }}
                type="button"
              >
                <Trash size={15} />
              </button>
            </div>
          ) : null}
          {selectedScreenshot ? (
            <Button
              className="mt-3 w-full"
              disabled={isUploading}
              onClick={() => void submitScreenshot()}
              size="sm"
              type="button"
            >
              <UploadSimple size={15} />
              {isUploading ? "正在提交..." : "提交截图"}
            </Button>
          ) : null}
          {uploadError ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-300">
              {uploadError}
            </p>
          ) : null}
          {uploadSuccess ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle size={15} weight="fill" />
              {copy.zelleUploadSuccess}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CopyablePaymentValue({
  copy,
  copied,
  label,
  onCopy,
  value,
}: {
  copy: PaymentCopy
  copied: boolean
  label: string
  onCopy: () => void
  value: string
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="truncate text-sm text-slate-950 dark:text-white">
          {value}
        </div>
      </div>
      <Button
        className="h-8 shrink-0 px-2 text-xs"
        onClick={onCopy}
        size="sm"
        type="button"
        variant="outline"
      >
        {copied ? (
          <Check size={14} weight="bold" />
        ) : (
          <ClipboardText size={14} />
        )}
        {copied ? copy.copiedValue : copy.copyValue}
      </Button>
    </div>
  )
}

function PaymentReviewSummary({
  className,
  order,
}: {
  className?: string
  order: PaymentOrder
}) {
  const review = order.review

  if (!review) return null

  return (
    <div
      className={`mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          订单评价
        </span>
        <span className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              className={
                value <= review.rating
                  ? "text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }
              key={value}
              size={16}
              weight={value <= review.rating ? "fill" : "regular"}
            />
          ))}
        </span>
      </div>
      {review.comment ? (
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {review.comment}
        </p>
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
  void checkoutPromise.then(
    () => schedulePaymentCheckoutCacheRemoval(cacheKey, checkoutPromise),
    () => undefined
  )
  return checkoutPromise
}

function schedulePaymentCheckoutCacheRemoval(
  cacheKey: string,
  checkoutPromise: Promise<PaymentCheckoutResult>
) {
  window.setTimeout(() => {
    if (paymentCheckoutPromises.get(cacheKey) === checkoutPromise) {
      paymentCheckoutPromises.delete(cacheKey)
    }
  }, 5_000)
}

function getPaymentSessionKey(order: PaymentOrder) {
  return [
    order.orderId,
    order.status,
    order.airwallexPaymentIntentId || "no-intent",
    order.paymentExpiresAt || "no-expiry",
  ].join(":")
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
}: {
  brandName: string
  copy: PaymentCopy
  logoImage: string
  order: PaymentOrder
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden border-b border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50/70 p-4 sm:p-5 dark:border-emerald-400/20 dark:from-emerald-500/10 dark:via-slate-900 dark:to-cyan-500/10"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-3">
        <CheckoutBrandHeader
          brandName={brandName}
          logoImage={logoImage}
          subtitle={copy.secureTitle}
        />
        <motion.div
          animate={{ scale: 1, rotate: 0 }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm shadow-emerald-500/25"
          initial={{ scale: 0.9, rotate: -3 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <CheckCircle size={14} weight="fill" />
          {copy.successTitle}
        </motion.div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4 border-t border-emerald-200/70 pt-3 dark:border-emerald-400/20">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {copy.totalAmount}
          </div>
          <div className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {order.amount}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {copy.fields.orderId}
          </div>
          <div className="mt-0.5 max-w-[12rem] truncate text-xs text-slate-950 dark:text-white">
            {order.orderId}
          </div>
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
        {copy.successDescription}
      </p>
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
        <Link to="/about#contact">{copy.contactSupport}</Link>
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
        <Link to="/about#contact">{copy.contactSupport}</Link>
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

function PaymentInfoPopover({
  copy,
  showPaymentNotice,
}: {
  copy: PaymentCopy
  showPaymentNotice: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="查看付款说明"
          className="size-7 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <WarningCircle size={17} weight="fill" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(19rem,calc(100vw-2rem))] p-3"
      >
        <div className="space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
          {showPaymentNotice ? (
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {copy.secureTitle}
              </div>
              <p className="mt-1">{copy.paymentNotice}</p>
            </div>
          ) : null}
          <div
            className={
              showPaymentNotice ? "border-t border-border pt-2" : undefined
            }
          >
            <div className="font-semibold text-slate-900 dark:text-white">
              {copy.policyLinksLabel}
            </div>
            <p className="mt-1">{copy.policyNotice}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
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
    paymentExpiresAt: order.paymentExpiresAt,
    paymentType,
    serviceAddress: order.serviceAddress ?? "",
    serviceArea: order.serviceArea,
    serviceDate: order.serviceDate,
    serviceType: order.serviceType,
    status: order.status,
    tipAmount: order.tipAmount ?? 0,
    zellePaymentProof: order.zellePaymentProof,
    review: order.review,
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
