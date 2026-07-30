import fs from "node:fs"
import path from "node:path"

import {
  fetchWecomCustomerRelations,
  fetchWecomCustomersByExternalIds,
  isWecomConfigured,
} from "@/lib/wecom-client"
import { logServerEvent } from "@/lib/server-log"
import type {
  WecomCustomer,
  WecomCustomerPage,
  WecomSyncSettings,
} from "@/lib/wecom-types"

type Database = {
  close: () => void
  exec: (sql: string) => unknown
  prepare: (sql: string) => {
    all: (...params: unknown[]) => unknown[]
    get: (...params: unknown[]) => unknown
    run: (...params: unknown[]) => unknown
  }
}
type DatabaseConstructor = new (filename: string) => Database
type CustomerRow = Record<
  | "add_time"
  | "add_way"
  | "auntie"
  | "avatar"
  | "corp_name"
  | "description"
  | "external_user_id"
  | "follow_user"
  | "follow_user_id"
  | "gender"
  | "name_and_type"
  | "position"
  | "region"
  | "relation_id"
  | "remark_mobiles"
  | "student_type"
  | "synced_at",
  string
>
type SettingsRow = {
  enabled: number
  hour: number
  last_completed_at: string
  last_count: number
  last_error: string
  last_started_at: string
  last_status: WecomSyncSettings["lastStatus"]
  minute: number
}

const sqliteFile =
  process.env.CMS_SQLITE_FILE ??
  path.join(/* turbopackIgnore: true */ process.cwd(), "data", "cms.sqlite")
let databaseConstructorPromise: Promise<DatabaseConstructor> | null = null
let syncPromise: Promise<WecomSyncSettings> | null = null

export async function listWecomCustomers(options: {
  page: number
  pageSize: number
  query: string
}): Promise<WecomCustomerPage> {
  const database = await openDatabase()
  try {
    const pageSize = clamp(options.pageSize, 10, 100, 20)
    const requestedPage = Math.max(1, Math.floor(options.page) || 1)
    const query = options.query.trim()
    const filter = query
      ? `WHERE name_and_type LIKE ? ESCAPE '\\'
          OR corp_name LIKE ? ESCAPE '\\'
          OR student_type LIKE ? ESCAPE '\\'
          OR region LIKE ? ESCAPE '\\'
          OR auntie LIKE ? ESCAPE '\\'
          OR follow_user LIKE ? ESCAPE '\\'
          OR description LIKE ? ESCAPE '\\'
          OR remark_mobiles LIKE ? ESCAPE '\\'`
      : ""
    const filterParams = query ? Array(8).fill(`%${escapeLike(query)}%`) : []
    const countRow = database
      .prepare(`SELECT COUNT(*) AS count FROM wecom_customers ${filter}`)
      .get(...filterParams) as { count: number }
    const totalCount = Number(countRow.count) || 0
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const page = Math.min(requestedPage, totalPages)
    const rows = database
      .prepare(
        `SELECT * FROM wecom_customers ${filter}
         ORDER BY add_time DESC, name_and_type COLLATE NOCASE
         LIMIT ? OFFSET ?`
      )
      .all(...filterParams, pageSize, (page - 1) * pageSize) as CustomerRow[]

    return {
      customers: rows.map(mapCustomerRow),
      pagination: { page, pageSize, totalCount, totalPages },
      settings: mapSettingsRow(readSettingsRow(database)),
    }
  } finally {
    database.close()
  }
}

export async function getWecomSyncSettings() {
  const database = await openDatabase()
  try {
    return mapSettingsRow(readSettingsRow(database))
  } finally {
    database.close()
  }
}

export async function updateWecomSyncSettings(input: {
  enabled: boolean
  hour: number
  minute: number
}) {
  const hour = clamp(input.hour, 0, 23, 2)
  const minute = clamp(input.minute, 0, 59, 0)
  const database = await openDatabase()
  try {
    database
      .prepare(
        `UPDATE wecom_sync_settings
         SET enabled = ?, hour = ?, minute = ?, updated_at = ?
         WHERE id = 1`
      )
      .run(input.enabled ? 1 : 0, hour, minute, new Date().toISOString())
    return mapSettingsRow(readSettingsRow(database))
  } finally {
    database.close()
  }
}

export function syncWecomCustomers() {
  if (syncPromise) return syncPromise
  syncPromise = runSync().finally(() => {
    syncPromise = null
  })
  return syncPromise
}

async function runSync() {
  const startedAt = new Date().toISOString()
  await updateSyncState({
    lastError: "",
    lastStartedAt: startedAt,
    lastStatus: "running",
  })

  try {
    const relationResult = await fetchWecomCustomerRelations()
    const listedRelations = relationResult.relations
    if (relationResult.invalidFollowUserIds.length) {
      logServerEvent("warn", "wecom.members.invalid_contacts_skipped", {
        followUserIds: relationResult.invalidFollowUserIds,
        skippedMemberCount: relationResult.invalidFollowUserIds.length,
        startedAt,
      })
    }
    const listedRelationIds = new Set(
      listedRelations.map((relation) => relation.relationId)
    )
    const existingRelationIds = await readExistingRelationIds()
    const listedMissingRelations = listedRelations.filter(
      (relation) => !existingRelationIds.has(relation.relationId)
    )
    const newExternalUserIds = [
      ...new Set(
        listedMissingRelations.map((relation) => relation.externalUserId)
      ),
    ]
    const detailResult = await fetchWecomCustomersByExternalIds(
      newExternalUserIds,
      listedRelationIds
    )
    const invalidExternalUserIds = new Set(detailResult.invalidExternalUserIds)
    const relations = listedRelations.filter(
      (relation) => !invalidExternalUserIds.has(relation.externalUserId)
    )
    const desiredRelationIds = new Set(
      relations.map((relation) => relation.relationId)
    )
    const deletedRelationIds = [...existingRelationIds].filter(
      (relationId) => !desiredRelationIds.has(relationId)
    )
    const missingRelations = relations.filter(
      (relation) => !existingRelationIds.has(relation.relationId)
    )
    const customers = detailResult.customers
    const fetchedRelationIds = new Set(
      customers.map((customer) => customer.relationId)
    )
    const unresolvedRelations = missingRelations.filter(
      (relation) => !fetchedRelationIds.has(relation.relationId)
    )
    if (unresolvedRelations.length) {
      throw new Error(
        `有 ${unresolvedRelations.length} 条新增客户关系未能获取详情，请稍后重试`
      )
    }
    if (invalidExternalUserIds.size) {
      logServerEvent("warn", "wecom.customers.invalid_contacts_skipped", {
        externalUserIds: [...invalidExternalUserIds],
        skippedCustomerCount: invalidExternalUserIds.size,
        startedAt,
      })
    }
    const database = await openDatabase()
    const completedAt = new Date().toISOString()
    let totalCount = 0
    try {
      database.exec("BEGIN IMMEDIATE")
      const remove = database.prepare(
        "DELETE FROM wecom_customers WHERE relation_id = ?"
      )
      for (const relationId of deletedRelationIds) {
        remove.run(relationId)
      }

      const upsert = database.prepare(
        `INSERT INTO wecom_customers (
          relation_id, external_user_id, follow_user_id, avatar, name_and_type,
          gender, position, corp_name, description, remark_mobiles,
          student_type, region, auntie, follow_user, add_time, add_way, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(relation_id) DO UPDATE SET
          external_user_id = excluded.external_user_id,
          follow_user_id = excluded.follow_user_id,
          avatar = excluded.avatar,
          name_and_type = excluded.name_and_type,
          gender = excluded.gender,
          position = excluded.position,
          corp_name = excluded.corp_name,
          description = excluded.description,
          remark_mobiles = excluded.remark_mobiles,
          student_type = excluded.student_type,
          region = excluded.region,
          auntie = excluded.auntie,
          follow_user = excluded.follow_user,
          add_time = excluded.add_time,
          add_way = excluded.add_way,
          synced_at = excluded.synced_at`
      )
      for (const customer of customers) {
        upsert.run(
          customer.relationId,
          customer.externalUserId,
          customer.followUserId,
          customer.avatar,
          customer.nameAndType,
          customer.gender,
          customer.position,
          customer.corpName,
          customer.description,
          customer.remarkMobiles,
          customer.studentType,
          customer.region,
          customer.auntie,
          customer.followUser,
          customer.addTime,
          customer.addWay,
          completedAt
        )
      }
      const countRow = database
        .prepare("SELECT COUNT(*) AS count FROM wecom_customers")
        .get() as { count: number }
      totalCount = Number(countRow.count) || 0
      if (totalCount !== desiredRelationIds.size) {
        throw new Error(
          `客户关系校验失败：企业微信返回 ${desiredRelationIds.size} 条，本地写入 ${totalCount} 条`
        )
      }
      database
        .prepare(
          `UPDATE wecom_sync_settings
           SET last_completed_at = ?, last_count = ?, last_error = '',
               last_status = 'success', updated_at = ? WHERE id = 1`
        )
        .run(completedAt, totalCount, completedAt)
      database.exec("COMMIT")
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    } finally {
      database.close()
    }

    logServerEvent("info", "wecom.customers.sync_completed", {
      addedRelationshipCount: missingRelations.length,
      customerCount: totalCount,
      removedRelationshipCount: deletedRelationIds.length,
      startedAt,
    })
    return getWecomSyncSettings()
  } catch (error) {
    const message = error instanceof Error ? error.message : "企业微信同步失败"
    await updateSyncState({ lastError: message, lastStatus: "failed" })
    logServerEvent("error", "wecom.customers.sync_failed", {
      error: message,
      startedAt,
    })
    throw error
  }
}

async function readExistingRelationIds() {
  const database = await openDatabase()
  try {
    const rows = database
      .prepare("SELECT relation_id FROM wecom_customers")
      .all() as Array<{ relation_id: string }>
    return new Set(rows.map((row) => row.relation_id))
  } finally {
    database.close()
  }
}

async function updateSyncState(fields: {
  lastError?: string
  lastStartedAt?: string
  lastStatus?: WecomSyncSettings["lastStatus"]
}) {
  const database = await openDatabase()
  try {
    const current = readSettingsRow(database)
    database
      .prepare(
        `UPDATE wecom_sync_settings
         SET last_error = ?, last_started_at = ?, last_status = ?, updated_at = ?
         WHERE id = 1`
      )
      .run(
        fields.lastError ?? current.last_error,
        fields.lastStartedAt ?? current.last_started_at,
        fields.lastStatus ?? current.last_status,
        new Date().toISOString()
      )
  } finally {
    database.close()
  }
}

function readSettingsRow(database: Database) {
  return database
    .prepare("SELECT * FROM wecom_sync_settings WHERE id = 1")
    .get() as SettingsRow
}

function mapSettingsRow(row: SettingsRow): WecomSyncSettings {
  return {
    configured: isWecomConfigured(),
    enabled: Boolean(row.enabled),
    hour: row.hour,
    lastCompletedAt: row.last_completed_at,
    lastCount: row.last_count,
    lastError: row.last_error,
    lastStartedAt: row.last_started_at,
    lastStatus: row.last_status,
    minute: row.minute,
    nextRunAt: row.enabled ? getNextRunAt(row.hour, row.minute) : "",
    timezone: "Asia/Shanghai",
  }
}

function mapCustomerRow(row: CustomerRow): WecomCustomer {
  return {
    addTime: row.add_time,
    addWay: row.add_way,
    auntie: row.auntie,
    avatar: row.avatar,
    corpName: row.corp_name,
    description: row.description,
    externalUserId: row.external_user_id,
    followUser: row.follow_user,
    followUserId: row.follow_user_id,
    gender: row.gender as WecomCustomer["gender"],
    nameAndType: row.name_and_type,
    position: row.position,
    region: row.region,
    relationId: row.relation_id,
    remarkMobiles: row.remark_mobiles,
    studentType: row.student_type,
    syncedAt: row.synced_at,
  }
}

export function getNextRunAt(hour: number, minute: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).formatToParts(now)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )
  const datePrefix = `${values.year}-${values.month}-${values.day}`
  let target = new Date(
    `${datePrefix}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`
  )
  if (target.getTime() <= now.getTime()) {
    target = new Date(target.getTime() + 24 * 60 * 60 * 1000)
  }
  return target.toISOString()
}

async function openDatabase() {
  fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(sqliteFile), {
    recursive: true,
  })
  const DatabaseSync = await loadDatabaseConstructor()
  const database = new DatabaseSync(/* turbopackIgnore: true */ sqliteFile)
  database.exec("PRAGMA busy_timeout = 5000")
  database.exec("PRAGMA journal_mode = WAL")
  database.exec(`
    CREATE TABLE IF NOT EXISTS wecom_customers (
      relation_id TEXT PRIMARY KEY,
      external_user_id TEXT NOT NULL,
      follow_user_id TEXT NOT NULL,
      avatar TEXT NOT NULL,
      name_and_type TEXT NOT NULL,
      gender TEXT NOT NULL,
      position TEXT NOT NULL,
      corp_name TEXT NOT NULL,
      description TEXT NOT NULL,
      remark_mobiles TEXT NOT NULL,
      student_type TEXT NOT NULL,
      region TEXT NOT NULL,
      auntie TEXT NOT NULL,
      follow_user TEXT NOT NULL,
      add_time TEXT NOT NULL,
      add_way TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_wecom_customers_add_time
      ON wecom_customers(add_time DESC);
    CREATE TABLE IF NOT EXISTS wecom_sync_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 0,
      hour INTEGER NOT NULL DEFAULT 2,
      minute INTEGER NOT NULL DEFAULT 0,
      last_started_at TEXT NOT NULL DEFAULT '',
      last_completed_at TEXT NOT NULL DEFAULT '',
      last_status TEXT NOT NULL DEFAULT 'idle',
      last_error TEXT NOT NULL DEFAULT '',
      last_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    INSERT OR IGNORE INTO wecom_sync_settings (id, updated_at)
      VALUES (1, CURRENT_TIMESTAMP);
  `)
  return database
}

async function loadDatabaseConstructor(): Promise<DatabaseConstructor> {
  const constructorPromise =
    databaseConstructorPromise ??
    new Function("specifier", "return import(specifier)")("node:sqlite").then(
      (module: { DatabaseSync: DatabaseConstructor }) => module.DatabaseSync
    )
  databaseConstructorPromise = constructorPromise
  return constructorPromise
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

function clamp(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.floor(value)))
    : fallback
}
