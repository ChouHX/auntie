"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ClipboardText,
  Code,
  CreditCard,
  Database,
  DownloadSimple,
  Eye,
  FloppyDisk,
  LinkSimple,
  ListChecks,
  UploadSimple,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  type PersistContent,
  RecordsPanel,
  UploadButton,
  createId,
  useAdminNoticeDialog,
} from "@/components/admin/admin-shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/ui/form-field"
import { ImagePreviewer } from "@/components/ui/image-previewer"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { defaultAfterSalesPage, defaultContactPage } from "@/data/cms-defaults"
import {
  fetchAdminPaymentRuntimeConfig,
  downloadAdminBackup,
  importAdminBackup,
  setStoredAdminToken,
  updateAdminPassword,
  uploadAdminImage,
  type AdminPaymentRuntimeConfig,
} from "@/lib/cms-api"
import { cn } from "@/lib/utils"
import type {
  CmsAfterSalesPageContent,
  CmsAfterSalesQrItem,
  CmsContactMethod,
  CmsContactPageContent,
  CmsContent,
  CmsPaymentSettings,
} from "@/types/cms"

const paymentCurrencyOptions = [
  { label: "USD 美元", value: "USD" },
  { label: "CAD 加元", value: "CAD" },
  { label: "AUD 澳元", value: "AUD" },
  { label: "GBP 英镑", value: "GBP" },
  { label: "HKD 港币", value: "HKD" },
  { label: "SGD 新加坡元", value: "SGD" },
  { label: "EUR 欧元", value: "EUR" },
]

export function PaymentSettingsAdmin({
  content,
  isSaving,
  onCommit,
  token,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
  token: string
}) {
  const [draft, setDraft] = useState<CmsPaymentSettings>(
    createAirwallexPaymentSettingsDraft(content.paymentSettings)
  )
  const [runtimeConfig, setRuntimeConfig] =
    useState<AdminPaymentRuntimeConfig | null>(null)
  const [runtimeError, setRuntimeError] = useState("")
  const airwallexRuntime = runtimeConfig?.airwallex
  const webhookUrl =
    airwallexRuntime?.webhookUrl ?? getAirwallexWebhookUrlFallback()
  const webhookSecretSourceLabel =
    airwallexRuntime?.webhookSecretSource === "env"
      ? "来自 AIRWALLEX_WEBHOOK_SECRET"
      : "未设置"
  const environmentChecklist = useMemo(
    () => [
      {
        configured: Boolean(airwallexRuntime?.clientIdConfigured),
        description: "Airwallex API Client ID，必须在服务端环境变量配置。",
        label: "AIRWALLEX_CLIENT_ID",
      },
      {
        configured: Boolean(airwallexRuntime?.apiKeyConfigured),
        description: "Airwallex API Key，必须在服务端环境变量配置。",
        label: "AIRWALLEX_API_KEY",
      },
      {
        configured: Boolean(airwallexRuntime?.webhookSecretConfigured),
        description: webhookSecretSourceLabel,
        label: "AIRWALLEX_WEBHOOK_SECRET",
      },
      {
        configured: Boolean(airwallexRuntime?.environmentConfigured),
        description: "未配置时使用 Demo；生产部署请设置为 production。",
        label: "AIRWALLEX_ENV",
        optional: true,
      },
      {
        configured: Boolean(airwallexRuntime?.accountIdConfigured),
        description: "多账户或平台账号登录时需要；普通单账号可留空。",
        label: "AIRWALLEX_ACCOUNT_ID",
        optional: true,
      },
    ],
    [airwallexRuntime, webhookSecretSourceLabel]
  )

  useEffect(() => {
    let isMounted = true

    fetchAdminPaymentRuntimeConfig(token)
      .then((nextRuntimeConfig) => {
        if (isMounted) {
          setRuntimeConfig(nextRuntimeConfig)
          setRuntimeError("")
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setRuntimeError(
          error instanceof Error ? error.message : "支付运行配置读取失败"
        )
      })

    return () => {
      isMounted = false
    }
  }, [content.updatedAt, token])

  function updateDraft(patch: Partial<CmsPaymentSettings>) {
    setDraft((current) => ({
      ...current,
      ...patch,
      provider: "airwallex",
    }))
  }

  async function refreshRuntimeConfig() {
    setRuntimeError("")

    try {
      setRuntimeConfig(await fetchAdminPaymentRuntimeConfig(token))
      toast.success("支付运行配置已刷新")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "支付运行配置读取失败"
      setRuntimeError(message)
      toast.error(message)
    }
  }

  async function saveDraft() {
    const paymentSettings: CmsPaymentSettings = {
      ...draft,
      currency: normalizeAdminPaymentCurrency(draft.currency),
      provider: "airwallex",
    }
    const saved = await onCommit(
      (current) => ({
        ...current,
        paymentSettings,
      }),
      "支付配置已保存"
    )

    if (saved) {
      await refreshRuntimeConfig()
    }
  }

  async function copyConfigValue(value: string, label: string) {
    if (!value) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label}已复制`)
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  return (
    <RecordsPanel
      action={
        <Button
          className="h-8 rounded-md"
          disabled={isSaving}
          onClick={saveDraft}
          size="sm"
          type="button"
        >
          <FloppyDisk size={15} weight="bold" />
          {isSaving ? "保存中..." : "保存支付配置"}
        </Button>
      }
      count={1}
      description="启用 Airwallex Web 支付，选择默认币种，并检查服务端环境变量。"
      hideSearch
      query=""
      searchPlaceholder=""
      setQuery={() => null}
      showCount={false}
      title="支付配置"
    >
      <Card className="m-0 flex flex-col gap-5 rounded-xl border-border bg-card p-4 shadow-none sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <section className="flex flex-col gap-4 rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard size={16} weight="bold" />
                  Airwallex 运行状态
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  这里只展示配置状态，不展示 Client ID、API Key 或 webhook
                  secret 明文。
                </p>
              </div>
              <PaymentConfigStatusBadge
                configured={Boolean(airwallexRuntime?.configured)}
                pending={!runtimeConfig && !runtimeError}
              />
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-3 xl:grid-cols-1">
              <PaymentRuntimeRow
                label="当前环境"
                value={
                  airwallexRuntime?.environment === "production"
                    ? "Production"
                    : "Demo"
                }
              />
              <PaymentRuntimeRow
                label="API Base URL"
                value={airwallexRuntime?.apiBaseUrl ?? "读取中..."}
              />
              <PaymentRuntimeRow
                label="Webhook Secret"
                value={webhookSecretSourceLabel}
              />
            </div>

            {runtimeError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {runtimeError}
              </div>
            ) : null}

            <div>
              <Button
                className="h-8 rounded-md"
                onClick={refreshRuntimeConfig}
                size="sm"
                type="button"
                variant="outline"
              >
                <ListChecks size={14} weight="bold" />
                刷新运行状态
              </Button>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-border bg-background/60 p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <LinkSimple size={16} weight="bold" />
                Airwallex Webhook
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                在 Airwallex 后台创建 webhook
                时使用这个地址。支付成功后订单状态由 webhook 回写。
              </p>
            </div>
            <PaymentConfigValue
              label="Webhook URL"
              onCopy={() => copyConfigValue(webhookUrl, "Webhook URL")}
              value={webhookUrl}
            />
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div>必选事件：payment_link.paid</div>
              <div>
                建议事件：payment_intent.succeeded、payment_intent.cancelled
              </div>
            </div>
          </section>
        </div>

        <section className="grid gap-4 rounded-lg border border-border bg-background/60 p-4 lg:grid-cols-3">
          <FormField htmlFor="payment-settings-enabled" label="支付状态">
            <label
              className="flex h-9 items-center gap-3 rounded-md border border-border bg-card px-3 text-sm font-medium"
              htmlFor="payment-settings-enabled"
            >
              <Checkbox
                checked={draft.enabled}
                id="payment-settings-enabled"
                onCheckedChange={(checked) =>
                  updateDraft({ enabled: Boolean(checked) })
                }
              />
              启用支付接口
            </label>
          </FormField>
          <FormField label="支付通道">
            <div className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 text-sm">
              <span className="font-medium">Airwallex</span>
              <Badge variant="secondary">当前唯一通道</Badge>
            </div>
          </FormField>
          <FormField label="默认币种">
            <PaymentCurrencySelect
              onChange={(currency) => updateDraft({ currency })}
              value={draft.currency}
            />
          </FormField>
        </section>

        <section className="rounded-lg border border-border bg-background/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Code size={16} weight="bold" />
            服务端环境变量检查
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            API
            密钥必须放在部署环境中。修改环境变量后需要重启服务，再回到这里刷新状态。
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {environmentChecklist.map((item) => (
              <div
                className="rounded-lg border border-border bg-card px-3 py-3"
                key={item.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs">{item.label}</span>
                  <PaymentConfigStatusBadge
                    configured={item.configured}
                    optional={item.optional}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Card>
    </RecordsPanel>
  )
}

function PaymentConfigStatusBadge({
  configured,
  optional,
  pending,
}: {
  configured: boolean
  optional?: boolean
  pending?: boolean
}) {
  const label = pending
    ? "读取中"
    : configured
      ? "已配置"
      : optional
        ? "可选"
        : "未配置"

  return (
    <Badge
      className={cn(
        "shrink-0",
        configured && "border-primary/25 bg-primary/10 text-primary",
        pending && "border-border bg-muted text-muted-foreground",
        !configured &&
          !optional &&
          !pending &&
          "border-destructive/30 bg-destructive/10 text-destructive"
      )}
      variant={optional ? "amber" : "secondary"}
    >
      {label}
    </Badge>
  )
}

function PaymentRuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium break-all">{value}</span>
    </div>
  )
}

function PaymentConfigValue({
  label,
  onCopy,
  value,
}: {
  label: string
  onCopy: () => void
  value: string
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <code className="min-w-0 flex-1 rounded-md border border-border bg-muted px-3 py-2 text-xs break-all">
          {value}
        </code>
        <Button
          aria-label={`复制${label}`}
          className="size-9 rounded-md"
          onClick={onCopy}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <ClipboardText size={14} weight="bold" />
        </Button>
      </div>
    </div>
  )
}

function PaymentCurrencySelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void
  value: string
}) {
  const normalizedValue = normalizeAdminPaymentCurrency(value)
  const hasCustomValue = !paymentCurrencyOptions.some(
    (option) => option.value === normalizedValue
  )

  return (
    <Select onValueChange={onChange} value={normalizedValue}>
      <SelectTrigger className="h-9 rounded-md">
        <SelectValue placeholder="选择币种" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {paymentCurrencyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          {hasCustomValue ? (
            <SelectItem value={normalizedValue}>{normalizedValue}</SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function getAirwallexWebhookUrlFallback() {
  if (typeof window === "undefined") {
    return "/api/airwallex/webhook"
  }

  return `${window.location.origin}/api/airwallex/webhook`
}

function createAirwallexPaymentSettingsDraft(
  settings: CmsPaymentSettings
): CmsPaymentSettings {
  return {
    currency: normalizeAdminPaymentCurrency(settings.currency),
    enabled: Boolean(settings.enabled),
    provider: "airwallex",
  }
}

function normalizeAdminPaymentCurrency(value: string | undefined) {
  const currency = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")

  return currency || "USD"
}

export function SiteSettingsAdmin({
  content,
  isSaving,
  onCommit,
  token,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
  token: string
}) {
  const [draft, setDraft] = useState(() => createSiteSettingsDraft(content))
  const [contactUploadError, setContactUploadError] = useState("")
  const [afterSalesUploadError, setAfterSalesUploadError] = useState("")
  const [logoUploadError, setLogoUploadError] = useState("")
  const [isContactUploading, setIsContactUploading] = useState(false)
  const [isAfterSalesUploading, setIsAfterSalesUploading] = useState(false)
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [qrPreviewIndex, setQrPreviewIndex] = useState<number | null>(null)
  const [isLogoPreviewOpen, setIsLogoPreviewOpen] = useState(false)
  const [isBackupExporting, setIsBackupExporting] = useState(false)
  const [isBackupImporting, setIsBackupImporting] = useState(false)
  const backupInputRef = useRef<HTMLInputElement>(null)
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()
  const qrPreviewImages = useMemo(
    () => [
      {
        alt: "联系方式二维码",
        src: draft.contactQrImage.trim() || "/wechat_qrcode.jpg",
      },
      {
        alt: "售后处理二维码",
        src:
          draft.afterSalesSupportQrImage.trim() ||
          "/after-sales/support-qr-1.jpg",
      },
      {
        alt: "投诉建议二维码",
        src:
          draft.afterSalesFeedbackQrImage.trim() ||
          "/after-sales/support-qr-2.jpg",
      },
    ],
    [
      draft.afterSalesFeedbackQrImage,
      draft.afterSalesSupportQrImage,
      draft.contactQrImage,
    ]
  )
  const logoPreviewImage = draft.logoImage.trim() || "/logo.webp"

  function updateDraft(patch: Partial<SiteSettingsDraft>) {
    setDraft((current) => ({
      ...current,
      ...patch,
    }))
  }

  async function handleContactQrUpload(file: File) {
    setContactUploadError("")
    setIsContactUploading(true)

    try {
      const result = await uploadAdminImage(token, "pages", file)
      updateDraft({ contactQrImage: result.src })
    } catch (error) {
      setContactUploadError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsContactUploading(false)
    }
  }

  async function handleLogoUpload(file: File) {
    setLogoUploadError("")
    setIsLogoUploading(true)

    try {
      const result = await uploadAdminImage(token, "pages", file)
      updateDraft({ logoImage: result.src })
    } catch (error) {
      setLogoUploadError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsLogoUploading(false)
    }
  }

  async function handleAfterSalesQrUpload(
    file: File,
    field: "afterSalesFeedbackQrImage" | "afterSalesSupportQrImage"
  ) {
    setAfterSalesUploadError("")
    setIsAfterSalesUploading(true)

    try {
      const result = await uploadAdminImage(token, "pages", file)
      updateDraft({ [field]: result.src })
    } catch (error) {
      setAfterSalesUploadError(
        error instanceof Error ? error.message : "上传失败"
      )
    } finally {
      setIsAfterSalesUploading(false)
    }
  }

  async function saveSiteSettings() {
    await onCommit(
      (current) => ({
        ...current,
        afterSalesPage: createAfterSalesPageRecordFromSiteSettings(
          current.afterSalesPage,
          draft
        ),
        contactPage: createContactPageRecordFromSiteSettings(
          current.contactPage,
          draft
        ),
        notificationSettings: createNotificationSettingsFromSiteSettings(
          current.notificationSettings,
          draft
        ),
        siteSettings: createSiteSettingsFromSiteSettings(
          current.siteSettings,
          draft
        ),
      }),
      "站点设置已保存"
    )
  }

  async function exportDatabaseBackup() {
    setIsBackupExporting(true)
    try {
      const blob = await downloadAdminBackup(token)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `auntie-chen-backup-${new Date().toISOString().slice(0, 10)}.sqlite`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success("数据库备份已导出")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "数据库备份导出失败")
    } finally {
      setIsBackupExporting(false)
    }
  }

  async function importDatabaseBackup(file: File) {
    const confirmed = await confirmAction({
      confirmLabel: "导入并覆盖",
      description:
        "导入会覆盖当前站点的 SQLite 数据，包括订单、支付凭证、站点内容和企业微信缓存。此操作不可撤销，请确认已导出当前备份。",
      title: "确认导入数据库备份？",
      variant: "destructive",
    })
    if (!confirmed) return

    setIsBackupImporting(true)
    try {
      await importAdminBackup(token, file)
      toast.success("数据库备份已导入，正在刷新后台")
      window.setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "数据库备份导入失败")
    } finally {
      setIsBackupImporting(false)
      if (backupInputRef.current) backupInputRef.current.value = ""
    }
  }

  return (
    <RecordsPanel
      action={
        <Button
          className="h-8 rounded-md"
          disabled={
            isSaving ||
            isContactUploading ||
            isAfterSalesUploading ||
            isLogoUploading ||
            isBackupExporting ||
            isBackupImporting
          }
          onClick={saveSiteSettings}
          size="sm"
          type="button"
        >
          <FloppyDisk size={15} weight="bold" />
          {isSaving ? "保存中..." : "保存站点设置"}
        </Button>
      }
      count={12}
      description="维护站点标识、联系方式、三个二维码以及管理员通知邮件 SMTP。"
      hideSearch
      query=""
      searchPlaceholder=""
      setQuery={() => null}
      showCount={false}
      title="站点设置"
    >
      <Card className="m-3 m-4 rounded-none border-0 bg-transparent p-0 shadow-none">
        <div className="grid gap-3 xl:grid-cols-2">
          <section className="rounded-lg border border-border bg-card p-2.5 p-3 xl:col-span-2">
            <div className="mb-2 mb-3 flex items-start gap-2 [&_h2]:text-sm [&_h2]:font-semibold [&_p]:mt-0.5 [&_p]:text-xs [&_p]:text-muted-foreground [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-primary">
              <div>
                <h2>站点 Logo 与二维码</h2>
                <p>站点 Logo 与三个微信二维码，横排展示。</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <div className="grid content-start justify-items-center gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-center">
                <div className="text-xs font-medium text-foreground">
                  站点 Logo
                </div>
                <QrThumbnail
                  alt="站点 Logo"
                  onPreview={() => setIsLogoPreviewOpen(true)}
                  src={logoPreviewImage}
                />
                <UploadButton
                  disabled={isLogoUploading || isSaving}
                  label={isLogoUploading ? "上传中..." : "上传"}
                  onFile={handleLogoUpload}
                />
                {logoUploadError ? (
                  <div className="mb-0 mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {logoUploadError}
                  </div>
                ) : null}
              </div>
              <div className="grid content-start justify-items-center gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-center">
                <div className="text-xs font-medium text-foreground">
                  联系方式二维码
                </div>
                <QrThumbnail
                  alt="联系方式二维码"
                  onPreview={() => setQrPreviewIndex(0)}
                  src={qrPreviewImages[0].src}
                />
                <UploadButton
                  disabled={isContactUploading || isSaving}
                  label={isContactUploading ? "上传中..." : "上传"}
                  onFile={handleContactQrUpload}
                />
                {contactUploadError ? (
                  <div className="mb-0 mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {contactUploadError}
                  </div>
                ) : null}
              </div>
              <div className="grid content-start justify-items-center gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-center">
                <div className="text-xs font-medium text-foreground">
                  售后处理二维码
                </div>
                <QrThumbnail
                  alt="售后处理二维码"
                  onPreview={() => setQrPreviewIndex(1)}
                  src={qrPreviewImages[1].src}
                />
                <UploadButton
                  disabled={isAfterSalesUploading || isSaving}
                  label={isAfterSalesUploading ? "上传中..." : "上传"}
                  onFile={(file) =>
                    handleAfterSalesQrUpload(file, "afterSalesSupportQrImage")
                  }
                />
              </div>
              <div className="grid content-start justify-items-center gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-center">
                <div className="text-xs font-medium text-foreground">
                  投诉建议二维码
                </div>
                <QrThumbnail
                  alt="投诉建议二维码"
                  onPreview={() => setQrPreviewIndex(2)}
                  src={qrPreviewImages[2].src}
                />
                <UploadButton
                  disabled={isAfterSalesUploading || isSaving}
                  label={isAfterSalesUploading ? "上传中..." : "上传"}
                  onFile={(file) =>
                    handleAfterSalesQrUpload(file, "afterSalesFeedbackQrImage")
                  }
                />
                {afterSalesUploadError ? (
                  <div className="mb-0 mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {afterSalesUploadError}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-2.5 p-3">
            <div className="mb-2 mb-3 flex items-start gap-2 [&_h2]:text-sm [&_h2]:font-semibold [&_p]:mt-0.5 [&_p]:text-xs [&_p]:text-muted-foreground [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-primary">
              <div>
                <h2>联系方式</h2>
                <p>显示在联系我们、页脚和支付辅助入口中。</p>
              </div>
            </div>
            <div className="grid gap-2.5">
              <FormField className="space-y-1.5" label="电话 / 微信">
                <Input
                  className="h-8 rounded-md"
                  onChange={(event) =>
                    updateDraft({ phone: event.target.value })
                  }
                  value={draft.phone}
                />
              </FormField>
              <FormField className="space-y-1.5" label="站点联系邮箱">
                <Input
                  className="h-8 rounded-md"
                  onChange={(event) =>
                    updateDraft({ email: event.target.value })
                  }
                  type="email"
                  value={draft.email}
                />
              </FormField>
              <FormField className="space-y-1.5" label="表单通知邮箱">
                <Input
                  className="h-8 rounded-md"
                  onChange={(event) =>
                    updateDraft({ notificationEmail: event.target.value })
                  }
                  type="email"
                  value={draft.notificationEmail}
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-2.5 p-3">
            <div className="mb-2 mb-3 flex items-start gap-2 [&_h2]:text-sm [&_h2]:font-semibold [&_p]:mt-0.5 [&_p]:text-xs [&_p]:text-muted-foreground [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-primary">
              <div>
                <h2>通知 SMTP</h2>
                <p>用于用户付款完成、预约通知和加入申请邮件。</p>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <FormField className="space-y-1.5" label="SMTP Host">
                <Input
                  className="h-8 rounded-md"
                  onChange={(event) =>
                    updateDraft({ smtpHost: event.target.value })
                  }
                  placeholder="smtp.example.com"
                  value={draft.smtpHost}
                />
              </FormField>
              <FormField className="space-y-1.5" label="SMTP Port">
                <Input
                  className="h-8 rounded-md"
                  inputMode="numeric"
                  onChange={(event) =>
                    updateDraft({ smtpPort: event.target.value })
                  }
                  placeholder="587"
                  value={draft.smtpPort}
                />
              </FormField>
              <label className="flex h-8 items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 text-xs text-muted-foreground">
                <Checkbox
                  checked={draft.smtpSecure}
                  onCheckedChange={(checked) =>
                    updateDraft({ smtpSecure: checked === true })
                  }
                />
                <span>SSL / 465</span>
              </label>
              <FormField className="space-y-1.5" label="SMTP Username">
                <Input
                  className="h-8 rounded-md"
                  onChange={(event) =>
                    updateDraft({ smtpUsername: event.target.value })
                  }
                  value={draft.smtpUsername}
                />
              </FormField>
              <FormField
                className="space-y-1.5"
                label="SMTP Password / App Password"
              >
                <Input
                  className="h-8 rounded-md"
                  onChange={(event) =>
                    updateDraft({ smtpPassword: event.target.value })
                  }
                  type="password"
                  value={draft.smtpPassword}
                />
              </FormField>
              <FormField
                className="space-y-1.5"
                description="留空时默认使用 SMTP Username 作为发件邮箱。"
                label="发件邮箱"
              >
                <Input
                  className="h-8 rounded-md"
                  onChange={(event) =>
                    updateDraft({ smtpFrom: event.target.value })
                  }
                  type="email"
                  value={draft.smtpFrom}
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-2.5 p-3 xl:col-span-2">
            <div className="mb-3 flex items-start gap-2 [&_h2]:text-sm [&_h2]:font-semibold [&_p]:mt-0.5 [&_p]:text-xs [&_p]:text-muted-foreground [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-primary">
              <Database size={17} weight="bold" />
              <div>
                <h2>数据库备份</h2>
                <p>
                  导出或恢复整个 SQLite
                  数据库，包含订单、凭证、站点内容、上传图片和企业微信缓存。
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="leading-5">
                <div className="font-medium text-foreground">
                  导入会覆盖当前数据
                </div>
                <div>
                  后台上传的图片会自动写入
                  SQLite；项目内置静态图片无需单独恢复。
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  className="h-8 rounded-md"
                  disabled={isBackupExporting || isBackupImporting}
                  onClick={exportDatabaseBackup}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <DownloadSimple size={15} weight="bold" />
                  {isBackupExporting ? "导出中..." : "导出备份"}
                </Button>
                <Button
                  className="h-8 rounded-md"
                  disabled={isBackupExporting || isBackupImporting}
                  onClick={() => backupInputRef.current?.click()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <UploadSimple size={15} weight="bold" />
                  {isBackupImporting ? "导入中..." : "导入备份"}
                </Button>
                <input
                  accept=".sqlite,.db,application/vnd.sqlite3,application/octet-stream"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void importDatabaseBackup(file)
                  }}
                  ref={backupInputRef}
                  type="file"
                />
              </div>
            </div>
          </section>
        </div>
      </Card>
      {noticeDialog}
      <ImagePreviewer
        images={qrPreviewImages}
        onOpenChange={setQrPreviewIndex}
        openIndex={qrPreviewIndex}
      />
      <ImagePreviewer
        images={[{ alt: "站点 Logo", src: logoPreviewImage }]}
        onOpenChange={(index) => setIsLogoPreviewOpen(index !== null)}
        openIndex={isLogoPreviewOpen ? 0 : null}
      />
    </RecordsPanel>
  )
}

function QrThumbnail({
  alt,
  onPreview,
  src,
}: {
  alt: string
  onPreview: () => void
  src: string
}) {
  return (
    <button
      aria-label={`查看${alt}大图`}
      className="group group relative size-20 overflow-hidden rounded-lg border border-border bg-white p-1.5 text-slate-700 shadow-xs transition hover:border-primary/45 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/35 focus-visible:outline-none"
      onClick={onPreview}
      type="button"
    >
      <img alt={alt} className="size-full object-contain" src={src} />
      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/30 group-hover:opacity-100 group-focus-visible:bg-slate-950/30 group-focus-visible:opacity-100">
        <Eye size={18} weight="bold" />
      </span>
    </button>
  )
}

type SiteSettingsDraft = {
  afterSalesFeedbackQrImage: string
  afterSalesSupportQrImage: string
  contactQrImage: string
  email: string
  logoImage: string
  notificationEmail: string
  phone: string
  smtpFrom: string
  smtpHost: string
  smtpPassword: string
  smtpPort: string
  smtpSecure: boolean
  smtpUsername: string
}

function createSiteSettingsDraft(content: CmsContent): SiteSettingsDraft {
  const contactPage = normalizeContactPage(
    content.contactPage?.zh,
    defaultContactPage.zh
  )
  const afterSalesPage = normalizeAfterSalesPage(
    content.afterSalesPage?.zh,
    defaultAfterSalesPage.zh
  )
  const notificationSettings = content.notificationSettings

  return {
    afterSalesFeedbackQrImage:
      afterSalesPage.qrItems[1]?.src ||
      defaultAfterSalesPage.zh.qrItems[1]?.src ||
      "/after-sales/support-qr-2.jpg",
    afterSalesSupportQrImage:
      afterSalesPage.qrItems[0]?.src ||
      defaultAfterSalesPage.zh.qrItems[0]?.src ||
      "/after-sales/support-qr-1.jpg",
    contactQrImage: contactPage.qrImage || defaultContactPage.zh.qrImage,
    email: contactPage.contactEmail || defaultContactPage.zh.contactEmail,
    logoImage: content.siteSettings?.logoImage || "/logo.webp",
    notificationEmail:
      notificationSettings?.recipientEmail ||
      contactPage.contactEmail ||
      defaultContactPage.zh.contactEmail,
    phone: contactPage.contactPhone || defaultContactPage.zh.contactPhone,
    smtpFrom: notificationSettings?.smtpFrom || "",
    smtpHost: notificationSettings?.smtpHost || "",
    smtpPassword: notificationSettings?.smtpPassword || "",
    smtpPort: notificationSettings?.smtpPort || "587",
    smtpSecure: Boolean(notificationSettings?.smtpSecure),
    smtpUsername: notificationSettings?.smtpUsername || "",
  }
}

function createSiteSettingsFromSiteSettings(
  value: CmsContent["siteSettings"] | undefined,
  draft: SiteSettingsDraft
): CmsContent["siteSettings"] {
  return {
    ...value,
    logoImage: draft.logoImage.trim() || "/logo.webp",
  }
}

function createNotificationSettingsFromSiteSettings(
  value: CmsContent["notificationSettings"] | undefined,
  draft: SiteSettingsDraft
): CmsContent["notificationSettings"] {
  return {
    ...value,
    recipientEmail: draft.notificationEmail.trim(),
    smtpFrom: draft.smtpFrom.trim(),
    smtpHost: draft.smtpHost.trim(),
    smtpPassword: draft.smtpPassword,
    smtpPort: draft.smtpPort.trim().replace(/[^0-9]/g, "") || "587",
    smtpSecure: draft.smtpSecure,
    smtpUsername: draft.smtpUsername.trim(),
  }
}

function createContactPageRecordFromSiteSettings(
  value: CmsContent["contactPage"] | undefined,
  draft: SiteSettingsDraft
): CmsContent["contactPage"] {
  const current = cloneContactPageRecord(value)

  return {
    zh: applySiteSettingsToContactPage(
      current.zh,
      defaultContactPage.zh,
      draft
    ),
    en: applySiteSettingsToContactPage(
      current.en,
      defaultContactPage.en,
      draft
    ),
  }
}

function applySiteSettingsToContactPage(
  page: CmsContactPageContent,
  fallback: CmsContactPageContent,
  draft: SiteSettingsDraft
): CmsContactPageContent {
  const nextPage = normalizeContactPage(page, fallback)
  const phone = draft.phone.trim()
  const email = draft.email.trim()

  return {
    ...nextPage,
    contactEmail: email,
    contactPhone: phone,
    qrImage: draft.contactQrImage.trim() || fallback.qrImage,
    methods: nextPage.methods.map((method) => {
      if (method.id === "phone-wechat") {
        return { ...method, text: phone }
      }

      if (method.id === "support-email") {
        return { ...method, text: email }
      }

      return method
    }),
  }
}

function cloneContactPageRecord(
  value?: Partial<CmsContent["contactPage"]> | null
): CmsContent["contactPage"] {
  return {
    zh: normalizeContactPage(value?.zh, defaultContactPage.zh),
    en: normalizeContactPage(value?.en, defaultContactPage.en),
  }
}

function normalizeContactPage(
  value: Partial<CmsContactPageContent> | undefined,
  fallback: CmsContactPageContent
): CmsContactPageContent {
  return {
    ...fallback,
    ...value,
    methods: normalizeContactMethods(value?.methods, fallback.methods),
  }
}

function normalizeContactMethods(
  methods: CmsContactMethod[] | undefined,
  fallbackMethods: CmsContactMethod[]
) {
  const currentMethods = methods?.length ? methods : fallbackMethods

  return currentMethods.map((method, index) => ({
    id: method.id || fallbackMethods[index]?.id || createId("contact-method"),
    label: method.label || fallbackMethods[index]?.label || "联系方式",
    text: method.text || fallbackMethods[index]?.text || "",
  }))
}

function cloneAfterSalesPageRecord(
  value?: Partial<CmsContent["afterSalesPage"]> | null
): CmsContent["afterSalesPage"] {
  return {
    zh: normalizeAfterSalesPage(value?.zh, defaultAfterSalesPage.zh),
    en: normalizeAfterSalesPage(value?.en, defaultAfterSalesPage.en),
  }
}

function normalizeAfterSalesPage(
  value: Partial<CmsAfterSalesPageContent> | undefined,
  fallback: CmsAfterSalesPageContent
): CmsAfterSalesPageContent {
  return {
    ...fallback,
    ...value,
    qrItems: normalizeAfterSalesQrItems(value?.qrItems, fallback.qrItems),
  }
}

function normalizeAfterSalesQrItems(
  items: CmsAfterSalesQrItem[] | undefined,
  fallbackItems: CmsAfterSalesQrItem[]
) {
  const currentItems = items ?? []
  const length = Math.max(currentItems.length, fallbackItems.length)

  return Array.from({ length }, (_, index) => {
    const item = currentItems[index]
    const fallback = fallbackItems[index]

    return {
      id: item?.id || fallback?.id || createId("after-sales-qr"),
      label: item?.label || fallback?.label || "联系方式",
      src: item?.src || fallback?.src || "/wechat_qrcode.jpg",
    }
  })
}

function createAfterSalesPageRecordFromSiteSettings(
  value: CmsContent["afterSalesPage"] | undefined,
  draft: SiteSettingsDraft
): CmsContent["afterSalesPage"] {
  const current = cloneAfterSalesPageRecord(value)

  return {
    zh: applySiteSettingsToAfterSalesPage(
      current.zh,
      defaultAfterSalesPage.zh,
      draft
    ),
    en: applySiteSettingsToAfterSalesPage(
      current.en,
      defaultAfterSalesPage.en,
      draft
    ),
  }
}

function applySiteSettingsToAfterSalesPage(
  page: CmsAfterSalesPageContent,
  fallback: CmsAfterSalesPageContent,
  draft: SiteSettingsDraft
): CmsAfterSalesPageContent {
  const nextPage = normalizeAfterSalesPage(page, fallback)
  const fallbackSupportItem = fallback.qrItems[0] ?? {
    id: "support",
    label: "售后处理",
    src: "/after-sales/support-qr-1.jpg",
  }
  const fallbackFeedbackItem = fallback.qrItems[1] ?? {
    id: "feedback",
    label: "投诉建议",
    src: "/after-sales/support-qr-2.jpg",
  }
  const currentSupportItem = nextPage.qrItems[0] ?? fallbackSupportItem
  const currentFeedbackItem = nextPage.qrItems[1] ?? fallbackFeedbackItem

  return {
    ...nextPage,
    qrItems: [
      {
        ...currentSupportItem,
        id: currentSupportItem.id || fallbackSupportItem.id,
        label: currentSupportItem.label || fallbackSupportItem.label,
        src: draft.afterSalesSupportQrImage.trim() || fallbackSupportItem.src,
      },
      {
        ...currentFeedbackItem,
        id: currentFeedbackItem.id || fallbackFeedbackItem.id,
        label: currentFeedbackItem.label || fallbackFeedbackItem.label,
        src: draft.afterSalesFeedbackQrImage.trim() || fallbackFeedbackItem.src,
      },
    ],
  }
}

export function AccountAdmin({
  onTokenChange,
  token,
}: {
  onTokenChange: (token: string) => void
  token: string
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function savePassword() {
    if (newPassword.length < 8) {
      toast.error("新密码至少需要 8 位。")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致。")
      return
    }

    setIsSaving(true)
    try {
      const result = await updateAdminPassword(token, {
        currentPassword,
        newPassword,
      })
      setStoredAdminToken(result.token)
      onTokenChange(result.token)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("密码已更新。下次登录请使用新密码。")
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "密码更新失败"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <RecordsPanel
      action={
        <Button
          className="h-8 rounded-md"
          disabled={isSaving || !currentPassword || !newPassword}
          onClick={savePassword}
          size="sm"
          type="button"
        >
          <FloppyDisk size={15} weight="bold" />
          {isSaving ? "保存中..." : "保存密码"}
        </Button>
      }
      count={1}
      description="默认账号为 admin。首次部署后请在这里修改默认密码。"
      hideSearch
      query=""
      searchPlaceholder=""
      setQuery={() => null}
      title="账号安全"
    >
      <Card className="mx-4 my-4 max-w-2xl rounded-lg border-border bg-card p-4 shadow-none">
        <div className="grid gap-4">
          <FormField
            description="系统默认初始密码为 admin123。密码会以哈希形式保存在持久化数据卷中。"
            label="当前密码"
            required
          >
            <Input
              className="h-9 rounded-md"
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              value={currentPassword}
            />
          </FormField>
          <FormField label="新密码" required>
            <Input
              className="h-9 rounded-md"
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
          </FormField>
          <FormField label="确认新密码" required>
            <Input
              className="h-9 rounded-md"
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </FormField>
        </div>
      </Card>
    </RecordsPanel>
  )
}
