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
import { calculateOrderFinancialsSafely } from "@/lib/sales-formula"
import {
  dedupePaymentOrdersById,
  normalizePaymentOrderId,
} from "@/lib/payment-order-collection"
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
    all: (...params: unknown[]) => unknown[]
    get: (...params: unknown[]) => unknown
    run: (...params: unknown[]) => unknown
  }
}

type CmsUploadCollection = "blog" | "gallery" | "pages" | "reviews"

type CmsUploadRow = {
  collection: CmsUploadCollection
  data: Uint8Array
  filename: string
  mime_type: string
}

type CmsContentRow = {
  content_json: string
}

type DatabaseSyncConstructor = new (
  filename: string,
  options?: { readOnly?: boolean }
) => CmsDatabase

const cmsSqliteFile =
  process.env.CMS_SQLITE_FILE ??
  path.join(/* turbopackIgnore: true */ process.cwd(), "data", "cms.sqlite")

const cmsBackupMaxBytes = 100 * 1024 * 1024
const cmsUploadCollections: CmsUploadCollection[] = [
  "blog",
  "gallery",
  "pages",
  "reviews",
]
const cmsUploadExtensions = new Set([".gif", ".jpg", ".jpeg", ".png", ".webp"])
const adminToken = process.env.ADMIN_SESSION_TOKEN ?? "local-admin-token"
const defaultAdminPassword = "admin123"
const defaultAdminPasswordSalt = "auntie-chen-default-admin-v1"
const legacyDefaultRecipientEmail = "autiechen@gmail.com"

let writeQueue: Promise<unknown> = Promise.resolve()
let databaseSyncPromise: Promise<DatabaseSyncConstructor> | null = null
let sqliteBackupPromise: Promise<
  (source: CmsDatabase, filename: string) => Promise<number>
> | null = null

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
  const storedFormulaTemplates = (
    content.formulaTemplates ?? defaultCmsContent.formulaTemplates
  ).filter((template) => template.target === "orderProfit")
  const formulaTemplates = [
    storedFormulaTemplates.find((template) => template.enabled) ??
      storedFormulaTemplates[0] ??
      defaultCmsContent.formulaTemplates[0],
  ]
  const salesMembers = (
    content.salesMembers ?? defaultCmsContent.salesMembers
  ).map((member) => ({
    ...member,
    accountUsername: member.accountUsername?.trim().toLocaleLowerCase() ?? "",
    authVersion:
      Number.isInteger(Number(member.authVersion)) &&
      Number(member.authVersion) > 0
        ? Number(member.authVersion)
        : 1,
    commissionAdjustment: normalizeSignedFinanceAmount(
      member.commissionAdjustment
    ),
    commissionPercentage: normalizePercentage(member.commissionPercentage),
    status:
      member.status === "inactive"
        ? ("inactive" as const)
        : ("active" as const),
  }))
  const teamMembers = (
    content.teamMembers ?? defaultCmsContent.teamMembers
  ).map((member) => {
    const { salaryDeduction, ...currentMember } = member

    return {
      ...currentMember,
      salaryAdjustment:
        member.salaryAdjustment === undefined
          ? -normalizeFinanceAmount(salaryDeduction)
          : normalizeSignedFinanceAmount(member.salaryAdjustment),
      salaryHourlyRate: normalizeFinanceAmount(member.salaryHourlyRate),
      salaryMode:
        member.salaryMode === "hourly"
          ? ("hourly" as const)
          : ("percentage" as const),
      salaryPercentage: normalizePercentage(member.salaryPercentage),
    }
  })
  const financialContent = { formulaTemplates, salesMembers, teamMembers }
  const paymentOrders = dedupePaymentOrdersById(
    (content.paymentOrders ?? []).map((order) => {
      const normalized = normalizePaymentOrder(order, paymentSettings)
      return normalized.status === "paid" && !normalized.calculationSnapshot
        ? calculateOrderFinancialsSafely(normalized, financialContent)
        : normalized
    })
  )

  return {
    ...content,
    updatedAt: content.updatedAt || new Date().toISOString(),
    afterSalesPage: content.afterSalesPage ?? defaultCmsContent.afterSalesPage,
    bookingConfigs: content.bookingConfigs ?? defaultCmsContent.bookingConfigs,
    contactPage,
    dashboardTasks: content.dashboardTasks ?? defaultCmsContent.dashboardTasks,
    formulaTemplates,
    paymentOrders,
    paymentSettings,
    salesMembers,
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
    teamMembers,
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
  const storedBaseAmountValue = breakdownTotal
    ? Number(breakdownTotal.toFixed(2))
    : normalizePaymentAmountValue(order.baseAmountValue, order.amount)
  const tipAmount = normalizeTipAmount(order.tipAmount)
  const storedAmountValue =
    storedBaseAmountValue + tipAmount ||
    normalizePaymentAmountValue(order.amountValue, order.amount)
  const status = normalizePaymentOrderStatus(order.status)
  const receivedAmount = normalizeFinanceAmount(
    order.receivedAmount ?? (status === "paid" ? storedAmountValue : 0)
  )
  const amountValue =
    storedAmountValue || (status === "paid" ? receivedAmount : 0)
  const baseAmountValue =
    storedBaseAmountValue || Math.max(0, amountValue - tipAmount)
  const currency = normalizePaymentCurrency(
    order.currency || paymentSettings.currency
  )
  const amount =
    normalizePaymentAmountValue(undefined, order.amount) > 0 || amountValue <= 0
      ? order.amount
      : formatStoredPaymentAmount(amountValue, order.amount, currency)

  return {
    ...order,
    addOnItems: Array.isArray(order.addOnItems) ? order.addOnItems : [],
    addOnOther: order.addOnOther ?? "",
    amount,
    amountBreakdown,
    amountValue,
    auntieSalary: normalizeFinanceAmount(order.auntieSalary),
    baseAmountValue,
    bathrooms: normalizeBookingRoomCount(order.bathrooms, 1),
    bedrooms: order.studio ? 0 : normalizeBookingRoomCount(order.bedrooms, 1),
    currency,
    customerRelationId: order.customerRelationId ?? "",
    customerType: order.customerType ?? "",
    dealStatus:
      order.dealStatus === "converted" || status === "paid"
        ? "converted"
        : "unconverted",
    estimatedAmountValue: normalizeFinanceAmount(order.estimatedAmountValue),
    estimatedCurrency: normalizePaymentCurrency(
      order.estimatedCurrency || currency
    ),
    financeNote: order.financeNote ?? "",
    formulaTemplateIds: order.formulaTemplateIds?.orderProfit
      ? { orderProfit: order.formulaTemplateIds.orderProfit }
      : {},
    gatewayStatus: order.gatewayStatus ?? "",
    hasPets: order.hasPets === true,
    orderProfit: normalizeFinanceAmount(order.orderProfit),
    orderProfitCny:
      order.orderProfitCny === undefined
        ? undefined
        : normalizeSignedFinanceAmount(order.orderProfitCny),
    otherCost: normalizeFinanceAmount(order.otherCost),
    provider: order.provider === "offline" ? "offline" : "airwallex",
    profitExchangeRateAt: order.profitExchangeRateAt ?? "",
    profitExchangeRateToCny:
      order.profitExchangeRateToCny === undefined
        ? undefined
        : normalizeExchangeRate(order.profitExchangeRateToCny),
    receivedAmount,
    salesCommission: normalizeFinanceAmount(order.salesCommission),
    salesCommissionSnapshot: order.salesCommissionSnapshot
      ? {
          capturedAt: order.salesCommissionSnapshot.capturedAt ?? "",
          commissionAdjustment: normalizeSignedFinanceAmount(
            order.salesCommissionSnapshot.commissionAdjustment
          ),
          commissionPercentage: normalizePercentage(
            order.salesCommissionSnapshot.commissionPercentage
          ),
          salesMemberId: order.salesCommissionSnapshot.salesMemberId ?? "",
        }
      : undefined,
    salesMemberId: order.salesMemberId ?? "",
    salesOwner: order.salesOwner ?? "",
    serviceAddress: order.serviceAddress ?? "",
    serviceDurationHours: normalizeServiceDurationHours(
      order.serviceDurationHours
    ),
    status,
    tipAmount: normalizeTipAmount(order.tipAmount),
    webhookEventIds: Array.isArray(order.webhookEventIds)
      ? order.webhookEventIds.filter(Boolean)
      : [],
  }
}

function normalizeFinanceAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0
}

function normalizeSignedFinanceAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function normalizeExchangeRate(value: unknown) {
  const rate = Number(value)
  return Number.isFinite(rate) && rate > 0 ? Number(rate.toFixed(8)) : undefined
}

function normalizePercentage(value: unknown) {
  return Math.min(100, Math.max(0, normalizeFinanceAmount(value)))
}

function normalizeBookingRoomCount(value: unknown, fallback: number) {
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? count : fallback
}

function normalizeServiceDurationHours(value: unknown) {
  const duration = Number(value)
  return Number.isFinite(duration) && duration > 0
    ? Number(Math.min(duration, 168).toFixed(2))
    : 0
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

function formatStoredPaymentAmount(
  value: number,
  previousAmount: string,
  currency: string
) {
  const prefix = previousAmount.trim().match(/[^\d.,\s-]+/)?.[0]
  return prefix
    ? `${prefix}${value.toFixed(2)}`
    : `${currency} ${value.toFixed(2)}`
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
  database.exec(`
    CREATE TABLE IF NOT EXISTS cms_uploads (
      collection TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data BLOB NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (collection, filename)
    )
  `)

  return database
}

async function saveCmsUploadAsset(
  collection: CmsUploadCollection,
  filename: string,
  mimeType: string,
  data: Uint8Array
) {
  return enqueueCmsWrite(async () => {
    const database = await openCmsDatabase()
    try {
      database
        .prepare(
          `
            INSERT INTO cms_uploads (collection, filename, mime_type, data, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(collection, filename) DO UPDATE SET
              mime_type = excluded.mime_type,
              data = excluded.data
          `
        )
        .run(
          collection,
          filename,
          mimeType,
          Buffer.from(data),
          new Date().toISOString()
        )
    } finally {
      database.close()
    }
  })
}

async function syncUploadDirectoryToDatabase() {
  return enqueueCmsWrite(async () => {
    const database = await openCmsDatabase()
    try {
      const insert = database.prepare(
        `
          INSERT INTO cms_uploads (collection, filename, mime_type, data, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(collection, filename) DO UPDATE SET
            mime_type = excluded.mime_type,
            data = excluded.data
        `
      )

      for (const collection of cmsUploadCollections) {
        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          collection
        )
        if (!fs.existsSync(uploadDir)) continue

        for (const entry of fs.readdirSync(uploadDir, {
          withFileTypes: true,
        })) {
          if (!entry.isFile()) continue
          const extension = path.extname(entry.name).toLowerCase()
          if (!cmsUploadExtensions.has(extension)) continue
          const filePath = path.join(uploadDir, entry.name)
          const data = fs.readFileSync(filePath)
          insert.run(
            collection,
            entry.name,
            getUploadMimeType(extension),
            data,
            new Date().toISOString()
          )
        }
      }
    } finally {
      database.close()
    }
  })
}

async function restoreUploadsFromDatabase() {
  const database = await openCmsDatabase()
  try {
    const rows = database
      .prepare("SELECT collection, filename, mime_type, data FROM cms_uploads")
      .all() as CmsUploadRow[]

    for (const collection of cmsUploadCollections) {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        collection
      )
      fs.rmSync(uploadDir, { force: true, recursive: true })
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    for (const row of rows) {
      if (!cmsUploadCollections.includes(row.collection)) continue
      const filename = path.basename(row.filename)
      if (filename !== row.filename) continue
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        row.collection
      )
      fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(row.data))
    }
  } finally {
    database.close()
  }
}

function getUploadMimeType(extension: string) {
  return extension === ".gif"
    ? "image/gif"
    : extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg"
}

async function backupCmsDatabase() {
  await writeQueue.catch(() => null)
  await syncUploadDirectoryToDatabase()
  const database = await openCmsDatabase()
  const tempFile = `${cmsSqliteFile}.backup-${randomBytes(12).toString("hex")}`

  try {
    const backup = await loadSqliteBackup()

    await backup(database, tempFile)
    const backupData = fs.readFileSync(tempFile)
    if (backupData.byteLength > cmsBackupMaxBytes) {
      throw new Error("数据库备份文件超过大小限制。")
    }

    return backupData
  } finally {
    database.close()
    fs.rmSync(tempFile, { force: true })
  }
}

async function restoreCmsDatabase(backupData: Uint8Array) {
  if (
    backupData.byteLength === 0 ||
    backupData.byteLength > cmsBackupMaxBytes
  ) {
    throw new Error("备份文件为空或超过大小限制。")
  }

  await writeQueue.catch(() => null)
  await validateCmsBackup(backupData)

  const databaseDirectory = path.dirname(cmsSqliteFile)
  fs.mkdirSync(databaseDirectory, { recursive: true })
  const tempFile = `${cmsSqliteFile}.restore-${randomBytes(12).toString("hex")}`

  try {
    fs.writeFileSync(tempFile, backupData, { flag: "wx" })
    await validateCmsBackup(fs.readFileSync(tempFile))
    fs.rmSync(`${cmsSqliteFile}-wal`, { force: true })
    fs.rmSync(`${cmsSqliteFile}-shm`, { force: true })
    fs.renameSync(tempFile, cmsSqliteFile)
    await restoreUploadsFromDatabase()
  } finally {
    fs.rmSync(tempFile, { force: true })
  }
}

async function validateCmsBackup(backupData: Uint8Array) {
  const sqliteHeader = Buffer.from(backupData.subarray(0, 16)).toString("ascii")
  if (sqliteHeader !== "SQLite format 3\u0000") {
    throw new Error("备份文件不是有效的 SQLite 数据库。")
  }

  const tempFile = `${cmsSqliteFile}.validate-${randomBytes(12).toString("hex")}`
  fs.writeFileSync(tempFile, backupData, { flag: "wx" })

  try {
    const DatabaseSync = await loadDatabaseSync()
    const database = new DatabaseSync(tempFile, { readOnly: true })
    try {
      const integrity = database.prepare("PRAGMA integrity_check").get() as {
        integrity_check?: unknown
      }
      if (integrity.integrity_check !== "ok") {
        throw new Error("备份文件完整性校验失败。")
      }

      const tables = database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )
        .all() as Array<{ name: string }>
      const allowedTables = new Set([
        "cms_content",
        "cms_uploads",
        "wecom_customers",
        "wecom_sync_settings",
        "wecom_tag_colors",
      ])
      if (tables.some((table) => !allowedTables.has(table.name))) {
        throw new Error("备份文件包含不支持的数据表。")
      }

      const row = database
        .prepare("SELECT content_json FROM cms_content WHERE id = 1")
        .get() as { content_json?: unknown } | undefined
      if (typeof row?.content_json !== "string") {
        throw new Error("备份文件缺少 CMS 主数据。")
      }

      const content = JSON.parse(row.content_json) as {
        paymentOrders?: unknown
      }
      if (!content || typeof content !== "object") {
        throw new Error("备份文件中的 CMS 数据格式无效。")
      }
      if (
        content.paymentOrders !== undefined &&
        !Array.isArray(content.paymentOrders)
      ) {
        throw new Error("备份文件中的订单数据格式无效。")
      }
    } finally {
      database.close()
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("备份文件中的 CMS 数据不是有效 JSON。")
    }
    throw error
  } finally {
    fs.rmSync(tempFile, { force: true })
  }
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
  ) as (specifier: string) => Promise<{
    DatabaseSync: unknown
    backup: (source: CmsDatabase, filename: string) => Promise<number>
  }>

  return runtimeImport("node:sqlite")
}

async function loadSqliteBackup() {
  sqliteBackupPromise ??= loadNodeSqlite().then((module) => {
    if (typeof module.backup !== "function") {
      throw new Error("当前 Node.js 运行时不支持 SQLite 在线备份。")
    }
    return module.backup
  })
  return sqliteBackupPromise
}

function toPublicContent(content: CmsContent): CmsContent {
  const teamMembersWithRatings = computeTeamMemberRatings(
    content.teamMembers ?? [],
    content.paymentOrders ?? []
  ).map((member) => {
    const publicMember = { ...member }
    delete publicMember.salaryDeduction
    delete publicMember.salaryAdjustment
    delete publicMember.salaryHourlyRate
    delete publicMember.salaryMode
    delete publicMember.salaryPercentage
    return publicMember
  })
  return {
    ...content,
    adminSettings: undefined,
    dashboardTasks: [],
    teamMembers: teamMembersWithRatings,
    blogPosts: content.blogPosts.filter(isPublished).sort(sortByOrder),
    galleryItems: content.galleryItems.filter(isPublished).sort(sortByOrder),
    reviewItems: content.reviewItems.filter(isPublished).sort(sortByOrder),
    salesMembers: [],
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
    formulaTemplates: [],
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
    bookingConfigs: content.bookingConfigs,
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
  backupCmsDatabase,
  createAdminToken,
  findPaymentOrder,
  isAdminToken,
  normalizePaymentOrderId,
  readCmsContent,
  restoreCmsDatabase,
  restoreUploadsFromDatabase,
  saveCmsUploadAsset,
  syncUploadDirectoryToDatabase,
  toPublicContent,
  verifyAdminCredentials,
  updateCmsContent,
  writeCmsContent,
}

export type { CmsPaymentOrder }
