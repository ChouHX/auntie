import { sendMail, type SmtpConfig } from "@/lib/mailer"
import { normalizeNotificationSettings } from "@/lib/notification-settings"
import type { CmsNotificationSettings, CmsPaymentOrder } from "@/types/cms"

type FormSubmission = {
  fields: Array<[string, string]>
  formType: "estimate" | "join"
  submittedAt: string
}

type NotificationOptions = {
  logoImage?: string
}

const brandName = "陈阿姨到家"
const emailSubjectPrefix = "[Auntichen]"

function normalizeFormSubmission(
  formType: FormSubmission["formType"],
  body: unknown
): FormSubmission {
  const fields = Object.entries(body && typeof body === "object" ? body : {})
    .map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(", ") : String(value ?? ""),
    ])
    .filter(([, value]) => value.trim()) as Array<[string, string]>

  if (!fields.length) {
    throw serviceError(400, "empty_form", "Form submission cannot be empty.")
  }

  return {
    fields,
    formType,
    submittedAt: new Date().toISOString(),
  }
}

async function sendFormNotification(
  settings: CmsNotificationSettings,
  submission: FormSubmission,
  options: NotificationOptions = {}
) {
  settings = normalizeNotificationSettings(settings)
  if (!settings.enabled) return false
  const recipientEmail = settings.recipientEmail

  if (!recipientEmail || !isEmailLike(recipientEmail)) {
    throw serviceError(
      500,
      "notification_recipient_missing",
      "Notification recipient email is not configured."
    )
  }

  const formSubject =
    submission.formType === "join"
      ? "新的阿姨加入申请"
      : "新的立即预约 / 清洁报价需求"
  const subject = `${emailSubjectPrefix} ${formSubject}`
  const htmlRows = submission.fields
    .map(
      ([key, value]) =>
        `<tr><th style="padding:8px 10px;text-align:left;border:1px solid #e5e7eb;background:#f8fafc;">${escapeHtml(
          key
        )}</th><td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(
          value
        )}</td></tr>`
    )
    .join("")
  const text = [
    `${brandName} | Auntichen`,
    formSubject,
    `提交时间: ${submission.submittedAt}`,
    "",
    ...submission.fields.map(([key, value]) => `${key}: ${value}`),
  ].join("\n")
  const logoUrl = getLogoUrl(options)
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(
        logoUrl
      )}" alt="${brandName}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:12px;object-fit:cover;">`
    : `<div style="width:48px;height:48px;border-radius:12px;background:#245ef4;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;">陈</div>`
  const html = `<div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,'Microsoft YaHei',sans-serif;color:#0f172a;line-height:1.6;">
  <div style="max-width:680px;margin:0 auto;border:1px solid #e5e7eb;border-radius:18px;background:#ffffff;overflow:hidden;">
    <div style="display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
      ${logoHtml}
      <div>
        <div style="font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(
          brandName
        )}</div>
        <div style="font-size:12px;color:#64748b;">Auntichen Form Notification</div>
      </div>
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 8px;font-size:22px;line-height:1.35;color:#0f172a;">${escapeHtml(
        formSubject
      )}</h2>
      <p style="margin:0 0 18px;font-size:13px;color:#64748b;">提交时间：${escapeHtml(
        submission.submittedAt
      )}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">${htmlRows}</table>
    </div>
  </div>
</div>`

  await sendMail({
    cc: settings.ccEmails,
    html,
    smtp: createSmtpConfig(settings),
    subject,
    text,
    to: recipientEmail,
  })
  return true
}

async function sendPaymentOrderNotification(
  settings: CmsNotificationSettings,
  order: CmsPaymentOrder,
  options: NotificationOptions = {}
) {
  settings = normalizeNotificationSettings(settings)
  if (!settings.enabled) return false
  const recipientEmail = settings.recipientEmail

  if (!recipientEmail || !isEmailLike(recipientEmail)) {
    throw serviceError(
      500,
      "notification_recipient_missing",
      "Notification recipient email is not configured."
    )
  }

  const subject = `${emailSubjectPrefix} 用户预约付款完成`
  const fields = (
    [
      ["订单编号", order.orderId],
      ["客户姓名", order.customerName],
      ["联系方式", order.contact],
      ["服务城市 / 区域", order.serviceArea],
      ["详细地址", order.serviceAddress],
      ["服务日期", order.serviceDate],
      ["服务类型", order.serviceType],
      ["付款金额", order.amount],
      ["付款状态", order.status],
      ["备注", order.note],
    ] satisfies Array<[string, string]>
  ).filter(([, value]) => value.trim())
  const htmlRows = createHtmlRows(fields)
  const text = [
    `${brandName} | Auntichen`,
    "用户预约付款完成",
    `付款时间: ${new Date().toISOString()}`,
    "",
    ...fields.map(([key, value]) => `${key}: ${value}`),
  ].join("\n")
  const html = createNotificationHtml({
    logoUrl: getLogoUrl(options),
    rows: htmlRows,
    subtitle: "Auntichen Payment Notification",
    title: "用户预约付款完成",
  })

  await sendMail({
    cc: settings.ccEmails,
    html,
    smtp: createSmtpConfig(settings),
    subject,
    text,
    to: recipientEmail,
  })
  return true
}

async function sendBookingOrderNotification(
  settings: CmsNotificationSettings,
  order: CmsPaymentOrder,
  options: NotificationOptions = {}
) {
  const addOns = [
    ...(order.addOnItems ?? []).map((item) => item.label),
    order.addOnOther?.trim(),
  ].filter(Boolean)

  return sendFormNotification(
    settings,
    {
      formType: "estimate",
      submittedAt: order.createdAt,
      fields: [
        ["预约订单号", order.orderId],
        ["客户姓名", order.customerName],
        ["联系方式", order.contact],
        ["服务城市 / 区域", order.serviceArea],
        ["详细地址", order.serviceAddress],
        ["期望服务日期", order.serviceDate],
        ["服务类型", order.serviceType],
        [
          "房屋情况",
          order.studio
            ? `Studio（开间）/ ${order.bathrooms ?? 0} 卫`
            : `${order.bedrooms ?? 0} 卧 / ${order.bathrooms ?? 0} 卫`,
        ],
        ["是否有宠物", order.hasPets ? "是" : "否"],
        ["附加项目", addOns.join("、") || "无"],
        ["备注", order.note || "无"],
        ["预约状态", "待客服确认服务安排及费用"],
      ],
    },
    options
  )
}

function createSmtpConfig(settings: CmsNotificationSettings): SmtpConfig {
  const port = Number(settings.smtpPort || 587)

  return {
    from: settings.smtpFrom || settings.smtpUsername,
    host: settings.smtpHost,
    password: settings.smtpPassword,
    port: Number.isFinite(port) ? port : 587,
    secure: settings.smtpSecure,
    username: settings.smtpUsername,
  }
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function createHtmlRows(fields: Array<[string, string]>) {
  return fields
    .map(
      ([key, value]) =>
        `<tr><th style="padding:8px 10px;text-align:left;border:1px solid #e5e7eb;background:#f8fafc;">${escapeHtml(
          key
        )}</th><td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(
          value
        )}</td></tr>`
    )
    .join("")
}

function createNotificationHtml({
  logoUrl,
  rows,
  subtitle,
  title,
}: {
  logoUrl: string
  rows: string
  subtitle: string
  title: string
}) {
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(
        logoUrl
      )}" alt="${brandName}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:12px;object-fit:cover;">`
    : `<div style="width:48px;height:48px;border-radius:12px;background:#245ef4;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;">陈</div>`

  return `<div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,'Microsoft YaHei',sans-serif;color:#0f172a;line-height:1.6;">
  <div style="max-width:680px;margin:0 auto;border:1px solid #e5e7eb;border-radius:18px;background:#ffffff;overflow:hidden;">
    <div style="display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
      ${logoHtml}
      <div>
        <div style="font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(
          brandName
        )}</div>
        <div style="font-size:12px;color:#64748b;">${escapeHtml(subtitle)}</div>
      </div>
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;color:#0f172a;">${escapeHtml(
        title
      )}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
    </div>
  </div>
</div>`
}

function getLogoUrl({ logoImage }: NotificationOptions = {}) {
  const explicitLogoUrl = String(logoImage || "").trim() || "/logo.webp"
  // Request origins can contain Docker's internal host behind a reverse proxy.
  const publicSiteUrl =
    String(process.env.PUBLIC_SITE_URL || "").trim() || "https://auntiechen.com"

  if (/^https?:\/\//i.test(explicitLogoUrl)) {
    return explicitLogoUrl
  }

  return `${publicSiteUrl.replace(/\/+$/, "")}/${explicitLogoUrl.replace(
    /^\/+/,
    ""
  )}`
}

function serviceError(status: number, error: string, message: string) {
  const nextError = new Error(message) as Error & {
    error?: string
    status?: number
  }
  nextError.status = status
  nextError.error = error
  return nextError
}

export {
  normalizeFormSubmission,
  normalizeNotificationSettings,
  sendBookingOrderNotification,
  sendPaymentOrderNotification,
  sendFormNotification,
}

export { defaultNotificationSettings } from "@/lib/notification-settings"
