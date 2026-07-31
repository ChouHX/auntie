import fs from "node:fs"
import path from "node:path"
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto"

import { defaultCmsContent } from "@/data/cms-defaults"
import { normalizeNotificationSettings } from "@/lib/form-notifications"
import { logServerEvent } from "@/lib/server-log"
import type {
  CmsContent,
  CmsPaymentOrder,
  CmsPaymentOrderStatus,
  CmsPaymentSettings,
  CmsTeamMember,
} from "@/types/cms"

type CmsDatabase = {
  close: () => void
  exec: (sql: string) => unknown
  prepare: (sql: string) => {
    get: (...params: unknown[]) => unknown
    run: (...params: unknown[]) => unknown
  }
}

type CmsContentRow = {
  content_json: string
}

type DatabaseSyncConstructor = new (filename: string) => CmsDatabase

const cmsSqliteFile =
  process.env.CMS_SQLITE_FILE ??
  path.join(/* turbopackIgnore: true */ process.cwd(), "data", "cms.sqlite")
const adminToken = process.env.ADMIN_SESSION_TOKEN ?? "local-admin-token"
const defaultAdminPassword = "admin123"
const defaultAdminPasswordSalt = "auntie-chen-default-admin-v1"
const legacyDefaultRecipientEmail = "autiechen@gmail.com"

let writeQueue: Promise<unknown> = Promise.resolve()
let databaseSyncPromise: Promise<DatabaseSyncConstructor> | null = null

function withRuntimeDefaults(content: CmsContent): CmsContent {
  const contactPage = content.contactPage ?? defaultCmsContent.contactPage
  const paymentSettings = normalizePaymentSettings(content.paymentSettings)
  const notificationRecipient =
    content.notificationSettings?.recipientEmail?.trim() ?? ""
  const contactRecipient =
    contactPage.zh?.contactEmail?.trim() ??
    defaultCmsContent.contactPage.zh.contactEmail
  const recipientEmail =
    notificationRecipient &&
    notificationRecipient !== legacyDefaultRecipientEmail
      ? notificationRecipient
      : contactRecipient || notificationRecipient

  return {
    ...content,
    updatedAt: content.updatedAt || new Date().toISOString(),
    afterSalesPage: content.afterSalesPage ?? defaultCmsContent.afterSalesPage,
    contactPage,
    dashboardTasks: content.dashboardTasks ?? defaultCmsContent.dashboardTasks,
    paymentOrders: (content.paymentOrders ?? []).map((order) =>
      normalizePaymentOrder(order, paymentSettings)
    ),
    paymentSettings,
    notificationSettings: normalizeNotificationSettings({
      ...content.notificationSettings,
      recipientEmail,
    }),
    siteSettings: {
      ...defaultCmsContent.siteSettings,
      ...content.siteSettings,
    },
    serviceRegions: content.serviceRegions ?? defaultCmsContent.serviceRegions,
    serviceLocations:
      content.serviceLocations ?? defaultCmsContent.serviceLocations,
    teamMembers: content.teamMembers ?? defaultCmsContent.teamMembers,
  }
}

function normalizePaymentOrder(
  order: CmsPaymentOrder,
  paymentSettings: CmsPaymentSettings
): CmsPaymentOrder {
  const amountBreakdown = normalizePaymentAmountBreakdown(order.amountBreakdown)
  const breakdownTotal = amountBreakdown.reduce(
    (sum, item) => sum + item.amount,
    0
  )
  const baseAmountValue = breakdownTotal
    ? Number(breakdownTotal.toFixed(2))
    : normalizePaymentAmountValue(order.baseAmountValue, order.amount)
  const tipAmount = normalizeTipAmount(order.tipAmount)

  return {
    ...order,
    amountBreakdown,
    amountValue:
      baseAmountValue + tipAmount ||
      normalizePaymentAmountValue(order.amountValue, order.amount),
    baseAmountValue,
    currency: normalizePaymentCurrency(
      order.currency || paymentSettings.currency
    ),
    gatewayStatus: order.gatewayStatus ?? "",
    provider: "airwallex",
    serviceAddress: order.serviceAddress ?? "",
    status: normalizePaymentOrderStatus(order.status),
    tipAmount: normalizeTipAmount(order.tipAmount),
    webhookEventIds: Array.isArray(order.webhookEventIds)
      ? order.webhookEventIds.filter(Boolean)
      : [],
  }
}

function normalizeTipAmount(value: unknown) {
  const amount = Number(value)

  return Number.isFinite(amount) && amount > 0
    ? Number(Math.min(amount, 1000).toFixed(2))
    : 0
}

function normalizePaymentAmountBreakdown(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const record = item as { amount?: unknown; label?: unknown }
      const label = String(record.label ?? "")
        .trim()
        .slice(0, 80)
      const amount = Number(record.amount)

      if (!label || !Number.isFinite(amount) || amount < 0) {
        return null
      }

      return { amount: Number(amount.toFixed(2)), label }
    })
    .filter((item): item is { amount: number; label: string } => item !== null)
    .slice(0, 20)
}

function normalizePaymentSettings(
  settings: CmsPaymentSettings | undefined
): CmsPaymentSettings {
  const fallback = defaultCmsContent.paymentSettings

  return {
    currency: normalizePaymentCurrency(settings?.currency || fallback.currency),
    enabled: Boolean(settings?.enabled),
    provider: "airwallex",
  }
}

function normalizePaymentAmountValue(value: unknown, fallback: string) {
  const numericValue = Number(value)

  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return numericValue
  }

  const amount = Number(
    fallback.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0
  )

  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

function normalizePaymentCurrency(value: string | undefined) {
  const currency = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")

  return currency || "USD"
}

function normalizePaymentOrderStatus(value: unknown): CmsPaymentOrderStatus {
  return [
    "awaiting_confirmation",
    "cancelled",
    "failed",
    "paid",
    "pending",
    "unpaid",
  ].includes(String(value))
    ? (value as CmsPaymentOrderStatus)
    : "unpaid"
}

async function readCmsContent(): Promise<CmsContent> {
  await writeQueue.catch(() => null)

  return withRuntimeDefaults(
    (await readCmsContentFromDatabase()) ?? defaultCmsContent
  )
}

async function readCmsContentFromDatabase(): Promise<CmsContent | null> {
  const database = await openCmsDatabase()

  try {
    const row = database
      .prepare("SELECT content_json FROM cms_content WHERE id = 1")
      .get() as CmsContentRow | undefined

    if (!row?.content_json) {
      return null
    }

    return JSON.parse(row.content_json) as CmsContent
  } finally {
    database.close()
  }
}

async function writeCmsContent(content: CmsContent): Promise<CmsContent> {
  return enqueueCmsWrite(async () => writeNextCmsContent(content))
}

async function updateCmsContent(
  updater: (current: CmsContent) => CmsContent
): Promise<CmsContent> {
  return enqueueCmsWrite(async () => {
    const currentContent = withRuntimeDefaults(
      (await readCmsContentFromDatabase()) ?? defaultCmsContent
    )

    return writeNextCmsContent(updater(currentContent))
  })
}

function enqueueCmsWrite<T>(operation: () => Promise<T>): Promise<T> {
  const nextWrite = writeQueue.then(operation, operation)
  writeQueue = nextWrite.catch(() => null)

  return nextWrite
}

async function writeNextCmsContent(content: CmsContent) {
  const nextContent = withRuntimeDefaults({
    ...content,
    updatedAt: new Date().toISOString(),
  })
  const database = await openCmsDatabase()

  try {
    database
      .prepare(
        `
          INSERT INTO cms_content (id, content_json, updated_at)
          VALUES (1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            content_json = excluded.content_json,
            updated_at = excluded.updated_at
        `
      )
      .run(JSON.stringify(nextContent), nextContent.updatedAt)
  } finally {
    database.close()
  }

  logServerEvent("info", "cms.content.write_completed", {
    databaseFile: cmsSqliteFile,
    orderCount: nextContent.paymentOrders.length,
    updatedAt: nextContent.updatedAt,
  })

  return nextContent
}

async function openCmsDatabase() {
  fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(cmsSqliteFile), {
    recursive: true,
  })

  const DatabaseSync = await loadDatabaseSync()
  const database = new DatabaseSync(/* turbopackIgnore: true */ cmsSqliteFile)
  database.exec("PRAGMA busy_timeout = 5000")
  database.exec("PRAGMA journal_mode = WAL")
  database.exec(`
    CREATE TABLE IF NOT EXISTS cms_content (
      id INTEGER PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  return database
}

async function loadDatabaseSync() {
  databaseSyncPromise ??= loadNodeSqlite().then(
    (module) => module.DatabaseSync as DatabaseSyncConstructor
  )

  return databaseSyncPromise
}

function loadNodeSqlite() {
  const runtimeImport = new Function(
    "specifier",
    "return import(specifier)"
  ) as (specifier: string) => Promise<{ DatabaseSync: unknown }>

  return runtimeImport("node:sqlite")
}

function toPublicContent(content: CmsContent): CmsContent {
  const teamMembersWithRatings = computeTeamMemberRatings(
    content.teamMembers ?? [],
    content.paymentOrders ?? []
  )
  return {
    ...content,
    adminSettings: undefined,
    dashboardTasks: [],
    teamMembers: teamMembersWithRatings,
    blogPosts: content.blogPosts.filter(isPublished).sort(sortByOrder),
    galleryItems: content.galleryItems.filter(isPublished).sort(sortByOrder),
    reviewItems: content.reviewItems.filter(isPublished).sort(sortByOrder),
    faq: {
      zh: {
        ...content.faq.zh,
        items: content.faq.zh.items.filter(isPublished).sort(sortByOrder),
      },
      en: {
        ...content.faq.en,
        items: content.faq.en.items.filter(isPublished).sort(sortByOrder),
      },
    },
    paymentOrders: [],
    paymentSettings: content.paymentSettings,
    notificationSettings: {
      recipientEmail: "",
      smtpFrom: "",
      smtpHost: "",
      smtpPassword: "",
      smtpPort: "",
      smtpSecure: false,
      smtpUsername: "",
    },
    serviceRegions: content.serviceRegions,
    serviceLocations: content.serviceLocations,
  }
}

function computeTeamMemberRatings(
  members: CmsTeamMember[],
  orders: CmsPaymentOrder[]
): CmsTeamMember[] {
  return members.map((member) => {
    const assignedOrders = orders.filter(
      (o) => o.assignedAuntieId === member.id && o.status === "paid"
    )
    const reviewedOrders = assignedOrders.filter((o) => o.review)
    const ratings = reviewedOrders
      .map((o) => o.review!.rating)
      .filter((r) => Number.isFinite(r) && r > 0)
    const avgRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10
          ) / 10
        : member.rating
    return {
      ...member,
      rating: avgRating,
      completedCount: assignedOrders.length,
    }
  })
}

function normalizePaymentOrderId(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function findPaymentOrder(content: CmsContent, orderId: string) {
  const normalizedOrderId = normalizePaymentOrderId(orderId)

  return (
    content.paymentOrders.find(
      (order) => normalizePaymentOrderId(order.orderId) === normalizedOrderId
    ) ?? null
  )
}

async function isAdminToken(value: string | null) {
  if (!value) return false
  const content = await readCmsContent()
  const auth = getAdminAuthState(content)

  // Keep the deployment token as a bootstrap credential only. Once a
  // password is persisted, password-derived session tokens are required.
  if (!auth.hasStoredPassword && value === adminToken) return true

  return verifySessionToken(value, auth.authVersion)
}

async function createAdminToken() {
  const auth = getAdminAuthState(await readCmsContent())
  return createSessionToken(auth.authVersion)
}

async function verifyAdminCredentials(username: string, password: string) {
  if (username !== "admin") return false
  const auth = getAdminAuthState(await readCmsContent())
  return verifyPassword(password, auth.passwordHash)
}

async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
) {
  const content = await readCmsContent()
  const auth = getAdminAuthState(content)
  if (!verifyPassword(currentPassword, auth.passwordHash)) return null

  const passwordHash = hashPassword(newPassword)
  const nextContent = await updateCmsContent((current) => ({
    ...current,
    adminSettings: {
      authVersion: auth.authVersion + 1,
      passwordHash,
      username: current.adminSettings?.username || "admin",
    },
  }))

  return createSessionToken(getAdminAuthState(nextContent).authVersion)
}

function getAdminAuthState(content: CmsContent) {
  const storedPasswordHash = content.adminSettings?.passwordHash?.trim() ?? ""
  const authVersion = Number(content.adminSettings?.authVersion)

  return {
    authVersion:
      Number.isInteger(authVersion) && authVersion > 0 ? authVersion : 1,
    hasStoredPassword: Boolean(storedPasswordHash),
    passwordHash:
      storedPasswordHash ||
      hashPassword(defaultAdminPassword, defaultAdminPasswordSalt),
  }
}

function hashPassword(
  password: string,
  salt = randomBytes(16).toString("hex")
) {
  const digest = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${digest}`
}

function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, salt, expectedHex] = encodedHash.split("$")
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false

  const expected = Buffer.from(expectedHex, "hex")
  const actual = scryptSync(password, salt, expected.length || 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function createSessionToken(authVersion: number) {
  const nonce = randomBytes(24).toString("hex")
  const payload = `${authVersion}.${nonce}`
  const signature = createHmac("sha256", adminToken)
    .update(payload)
    .digest("hex")
  return `${payload}.${signature}`
}

function verifySessionToken(value: string, authVersion: number) {
  const [version, nonce, signature] = value.split(".")
  if (!version || !nonce || !signature || Number(version) !== authVersion) {
    return false
  }

  const expected = createHmac("sha256", adminToken)
    .update(`${version}.${nonce}`)
    .digest("hex")
  const actual = Buffer.from(signature, "utf8")
  const expectedBuffer = Buffer.from(expected, "utf8")
  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  )
}

function isPublished(item: { status: string }) {
  return item.status === "published"
}

function sortByOrder(
  left: { sortOrder: number },
  right: { sortOrder: number }
) {
  return left.sortOrder - right.sortOrder
}

export {
  changeAdminPassword,
  createAdminToken,
  findPaymentOrder,
  isAdminToken,
  normalizePaymentOrderId,
  readCmsContent,
  toPublicContent,
  verifyAdminCredentials,
  updateCmsContent,
  writeCmsContent,
}

export type { CmsPaymentOrder }
