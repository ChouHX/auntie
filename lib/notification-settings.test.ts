import assert from "node:assert/strict"
import test from "node:test"
import type { CmsNotificationSettings } from "@/types/cms"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const notificationSettings = await import("./notification-settings.ts")
const { getNotificationSettingsIssues, normalizeNotificationSettings } =
  notificationSettings

const configured: CmsNotificationSettings = {
  enabled: true,
  recipientEmail: "admin@example.com",
  smtpHost: "smtp.example.com",
  smtpPort: "587",
  smtpSecure: false,
  smtpUsername: "sender@example.com",
  smtpPassword: "test-password",
  smtpFrom: "",
}

test("notifications default to disabled and cannot be enabled with incomplete settings", () => {
  assert.equal(normalizeNotificationSettings().enabled, false)
  for (const field of [
    "recipientEmail",
    "smtpHost",
    "smtpPort",
    "smtpUsername",
    "smtpPassword",
  ] as const) {
    const settings = { ...configured, [field]: " " }
    assert.ok(getNotificationSettingsIssues(settings).length > 0, field)
    assert.equal(normalizeNotificationSettings(settings).enabled, false, field)
  }
})

test("complete settings honor the switch and allow the username as sender", () => {
  assert.equal(normalizeNotificationSettings(configured).enabled, true)
  assert.equal(
    normalizeNotificationSettings({ ...configured, enabled: false }).enabled,
    false
  )
  assert.deepEqual(getNotificationSettingsIssues(configured), [])
})

test("legacy complete settings keep working, but fixing disabled settings requires explicit enabling", () => {
  const legacy: Partial<CmsNotificationSettings> = { ...configured }
  delete legacy.enabled
  assert.equal(normalizeNotificationSettings(legacy).enabled, true)
  const incomplete = normalizeNotificationSettings({
    ...configured,
    smtpPassword: "",
  })
  assert.equal(
    normalizeNotificationSettings({
      ...incomplete,
      smtpPassword: "repaired-password",
    }).enabled,
    false
  )
})

test("invalid addresses, host URLs, and ports disable notification delivery", () => {
  for (const patch of [
    { recipientEmail: "not-an-email" },
    { smtpFrom: "invalid-sender" },
    { smtpHost: "https://smtp.example.com" },
    { smtpPort: "0" },
    { smtpPort: "65536" },
    { smtpPort: "587abc" },
    { smtpPort: "58.7" },
  ]) {
    assert.equal(
      normalizeNotificationSettings({ ...configured, ...patch }).enabled,
      false,
      JSON.stringify(patch)
    )
  }
})

test("an explicit sender allows non-email SMTP usernames and passwords are preserved", () => {
  const settings = normalizeNotificationSettings({
    ...configured,
    smtpUsername: "account-name",
    smtpFrom: "Support <sender@example.com>",
    smtpPassword: " password with spaces ",
  })
  assert.equal(settings.enabled, true)
  assert.equal(settings.smtpPassword, " password with spaces ")
})

test("CC is optional for legacy settings and normalizes multiple addresses without case duplicates", () => {
  assert.deepEqual(normalizeNotificationSettings(configured).ccEmails, [])
  const settings = normalizeNotificationSettings({
    ...configured,
    ccEmails: [
      " team@example.com ",
      "TEAM@example.com",
      "owner@example.com",
      "",
    ],
  })
  assert.equal(settings.enabled, true)
  assert.deepEqual(settings.ccEmails, ["team@example.com", "owner@example.com"])
})

test("invalid CC addresses remain visible for correction and disable notification delivery", () => {
  for (const email of [
    "invalid",
    "one@example.com,two@example.com",
    "copy@example.com\r\nBcc: hidden@example.com",
  ]) {
    const settings = normalizeNotificationSettings({
      ...configured,
      ccEmails: [email],
    })
    assert.equal(settings.enabled, false)
    assert.deepEqual(settings.ccEmails, [email])
    assert.ok(getNotificationSettingsIssues(settings).includes("抄送邮箱格式"))
  }
})
