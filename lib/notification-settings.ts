import type { CmsNotificationSettings } from "@/types/cms"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import { isEmailAddress, uniqueEmailAddresses } from "./email-addresses.ts"

const defaultNotificationSettings: CmsNotificationSettings = {
  ccEmails: [],
  enabled: false,
  recipientEmail: "auntiechenhome@gmail.com",
  smtpFrom: "",
  smtpHost: "",
  smtpPassword: "",
  smtpPort: "587",
  smtpSecure: false,
  smtpUsername: "",
}

function getNotificationSettingsIssues(
  value: Partial<CmsNotificationSettings>
): string[] {
  const issues: string[] = []
  const host = value.smtpHost?.trim() ?? ""
  const port = Number(value.smtpPort)
  if (!host || /[\s/:]/.test(host)) issues.push("有效的 SMTP Host")
  if (
    !/^\d+$/.test(value.smtpPort?.trim() ?? "") ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    issues.push("SMTP Port（1–65535）")
  }
  if (!value.smtpUsername?.trim()) issues.push("SMTP Username")
  if (!value.smtpPassword?.trim()) issues.push("SMTP Password / App Password")
  if (!isEmailAddress(value.recipientEmail?.trim() ?? ""))
    issues.push("通知收件邮箱")
  if ((value.ccEmails ?? []).some((email) => !isEmailAddress(email.trim()))) {
    issues.push("抄送邮箱格式")
  }
  const sender = value.smtpFrom?.trim() || value.smtpUsername?.trim() || ""
  const senderEmail = sender.match(/<([^>]+)>/)?.[1] ?? sender
  if (!isEmailAddress(senderEmail))
    issues.push("发件邮箱（或使用邮箱格式的 SMTP Username）")
  return issues
}

function normalizeNotificationSettings(
  value?: Partial<CmsNotificationSettings> | null
): CmsNotificationSettings {
  const settings: CmsNotificationSettings = {
    ccEmails: uniqueEmailAddresses(value?.ccEmails ?? []),
    enabled: false,
    recipientEmail: String(
      value?.recipientEmail ?? defaultNotificationSettings.recipientEmail
    ).trim(),
    smtpFrom: String(value?.smtpFrom ?? "").trim(),
    smtpHost: String(value?.smtpHost ?? "").trim(),
    smtpPassword: String(value?.smtpPassword ?? ""),
    smtpPort: String(
      value?.smtpPort ?? defaultNotificationSettings.smtpPort
    ).trim(),
    smtpSecure: Boolean(value?.smtpSecure),
    smtpUsername: String(value?.smtpUsername ?? "").trim(),
  }
  // Preserve notifications for existing, complete configurations without a switch.
  settings.enabled =
    (value?.enabled === undefined || value.enabled === true) &&
    getNotificationSettingsIssues(settings).length === 0
  return settings
}

export {
  defaultNotificationSettings,
  getNotificationSettingsIssues,
  normalizeNotificationSettings,
}
