import fs from "node:fs"
import path from "node:path"

import {
  fetchWecomCustomerRelations,
  fetchWecomCustomersByExternalIds,
  fetchWecomMemberProfiles,
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
  | "remark_corp_name"
  | "student_type"
  | "synced_at",
  string
>
type SettingsRow = {
  enabled: number
  hour: number
  interval_minutes: number
  last_completed_at: string
  last_count: number
  last_error: string
  last_started_at: string
  last_status: WecomSyncSettings["lastStatus"]
  minute: number
  next_run_at: string
  schedule_mode: string
}
type TagCategory = "auntie" | "region" | "student"
type TagColorRow = {
  category: TagCategory
  color_index: number
  tag_name: string
}

const tagColorCount = 8

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
          OR follow_user_id LIKE ? ESCAPE '\\'
          OR remark_corp_name LIKE ? ESCAPE '\\'
          OR description LIKE ? ESCAPE '\\'
          OR remark_mobiles LIKE ? ESCAPE '\\'`
      : ""
    const filterParams = query ? Array(10).fill(`%${escapeLike(query)}%`) : []
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
      tagColors: readTagColors(database),
    }
  } finally {
    database.close()
  }
}

export async function listAllWecomCustomersForAnalytics() {
  const database = await openDatabase()
  try {
    const rows = database
      .prepare("SELECT * FROM wecom_customers ORDER BY add_time DESC")
      .all() as CustomerRow[]
    return rows.map(mapCustomerRow)
  } finally {
    database.close()
  }
}

export async function getWecomCustomerByRelationId(relationId: string) {
  const normalizedRelationId = relationId.trim()
  if (!normalizedRelationId) return null

  const database = await openDatabase()
  try {
    const row = database
      .prepare("SELECT * FROM wecom_customers WHERE relation_id = ?")
      .get(normalizedRelationId) as CustomerRow | undefined
    return row ? mapCustomerRow(row) : null
  } finally {
    database.close()
  }
}

export async function listWecomStudentTags() {
  const database = await openDatabase()
  try {
    const rows = database
      .prepare("SELECT student_type FROM wecom_customers")
      .all() as Array<Pick<CustomerRow, "student_type">>
    return Array.from(
      new Set(rows.flatMap((row) => splitTagValues(row.student_type)))
    ).sort((left, right) => left.localeCompare(right, "zh-CN"))
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
  hour: number
  intervalMinutes: number
  minute: number
  mode: WecomSyncSettings["mode"]
}) {
  const hour = clamp(input.hour, 0, 23, 2)
  const intervalMinutes = clamp(input.intervalMinutes, 5, 1440, 60)
  const minute = clamp(input.minute, 0, 59, 0)
  const mode = normalizeSyncMode(input.mode)
  const database = await openDatabase()
  try {
    database
      .prepare(
        `UPDATE wecom_sync_settings
         SET enabled = ?, schedule_mode = ?, interval_minutes = ?,
             hour = ?, minute = ?, next_run_at = '', updated_at = ?
         WHERE id = 1`
      )
      .run(
        mode === "disabled" ? 0 : 1,
        mode,
        intervalMinutes,
        hour,
        minute,
        new Date().toISOString()
      )
    return mapSettingsRow(readSettingsRow(database))
  } finally {
    database.close()
  }
}

export async function updateWecomNextRunAt(nextRunAt: string) {
  const database = await openDatabase()
  try {
    database
      .prepare(
        `UPDATE wecom_sync_settings
         SET next_run_at = ?, updated_at = ?
         WHERE id = 1`
      )
      .run(nextRunAt, new Date().toISOString())
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
    const followUserIds = [
      ...new Set(listedRelations.map((relation) => relation.followUserId)),
    ]
    const memberProfileList = await fetchWecomMemberProfiles(followUserIds)
    const memberProfiles = new Map(
      memberProfileList.map((profile) => [profile.userId, profile])
    )
    const listedMissingRelations = listedRelations.filter(
      (relation) => !existingRelationIds.has(relation.relationId)
    )
    const newExternalUserIds = [
      ...new Set(
        listedMissingRelations.map((relation) => relation.externalUserId)
      ),
    ]
    const externalUserIdsNeedingProfile =
      await readExternalUserIdsNeedingProfile()
    const externalUserIdsToFetch = [
      ...new Set([...newExternalUserIds, ...externalUserIdsNeedingProfile]),
    ]
    const detailResult = await fetchWecomCustomersByExternalIds(
      externalUserIdsToFetch,
      listedRelationIds,
      memberProfiles
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
          student_type, region, auntie, follow_user, remark_corp_name,
          add_time, add_way, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          remark_corp_name = excluded.remark_corp_name,
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
          customer.remarkCorpName,
          customer.addTime,
          customer.addWay,
          completedAt
        )
      }
      rebuildTagColors(database, completedAt)
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

async function readExternalUserIdsNeedingProfile() {
  const database = await openDatabase()
  try {
    const rows = database
      .prepare(
        `SELECT DISTINCT external_user_id
         FROM wecom_customers
         WHERE remark_corp_name IS NULL`
      )
      .all() as Array<{ external_user_id: string }>
    return rows.map((row) => row.external_user_id)
  } finally {
    database.close()
  }
}

function readTagColors(database: Database) {
  const rows = database
    .prepare("SELECT category, tag_name, color_index FROM wecom_tag_colors")
    .all() as TagColorRow[]
  return Object.fromEntries(
    rows.map((row) => [`${row.category}:${row.tag_name}`, row.color_index])
  )
}

function rebuildTagColors(database: Database, syncedAt: string) {
  const rows = database
    .prepare("SELECT student_type, region, auntie FROM wecom_customers")
    .all() as Array<Pick<CustomerRow, "auntie" | "region" | "student_type">>
  const categories: Array<{
    category: TagCategory
    field: "auntie" | "region" | "student_type"
    offset: number
  }> = [
    { category: "student", field: "student_type", offset: 0 },
    { category: "region", field: "region", offset: 2 },
    { category: "auntie", field: "auntie", offset: 4 },
  ]
  const assignments: Array<{
    category: TagCategory
    colorIndex: number
    count: number
    tag: string
  }> = []

  for (const { category, field, offset } of categories) {
    const counts = new Map<string, number>()
    for (const row of rows) {
      for (const tag of splitTagValues(row[field])) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    const rankedTags = [...counts.entries()].sort(
      ([leftTag, leftCount], [rightTag, rightCount]) =>
        rightCount - leftCount || leftTag.localeCompare(rightTag, "zh-CN")
    )
    rankedTags.forEach(([tag, count], index) => {
      assignments.push({
        category,
        colorIndex: (index + offset) % tagColorCount,
        count,
        tag,
      })
    })
  }

  database.prepare("DELETE FROM wecom_tag_colors").run()
  const insert = database.prepare(
    `INSERT INTO wecom_tag_colors
      (category, tag_name, usage_count, color_index, synced_at)
     VALUES (?, ?, ?, ?, ?)`
  )
  for (const assignment of assignments) {
    insert.run(
      assignment.category,
      assignment.tag,
      assignment.count,
      assignment.colorIndex,
      syncedAt
    )
  }
}

function splitTagValues(value: string) {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
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
  const mode = row.enabled ? normalizeSyncMode(row.schedule_mode) : "disabled"
  return {
    configured: isWecomConfigured(),
    enabled: Boolean(row.enabled),
    hour: row.hour,
    intervalMinutes: row.interval_minutes,
    lastCompletedAt: row.last_completed_at,
    lastCount: row.last_count,
    lastError: row.last_error,
    lastStartedAt: row.last_started_at,
    lastStatus: row.last_status,
    minute: row.minute,
    mode,
    nextRunAt:
      mode === "daily"
        ? getNextRunAt(row.hour, row.minute)
        : mode === "interval"
          ? row.next_run_at || getNextIntervalRunAt(row.interval_minutes)
          : "",
    timezone: "Asia/Shanghai",
  }
}

function normalizeSyncMode(value: unknown): WecomSyncSettings["mode"] {
  return value === "interval" || value === "disabled" ? value : "daily"
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
    remarkCorpName: row.remark_corp_name ?? "",
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

export function getNextIntervalRunAt(
  intervalMinutes: number,
  now = new Date()
) {
  const normalizedInterval = clamp(intervalMinutes, 5, 1440, 60)
  return new Date(now.getTime() + normalizedInterval * 60 * 1000).toISOString()
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
      follow_user_avatar TEXT,
      remark_corp_name TEXT,
      add_time TEXT NOT NULL,
      add_way TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_wecom_customers_add_time
      ON wecom_customers(add_time DESC);
    CREATE TABLE IF NOT EXISTS wecom_tag_colors (
      category TEXT NOT NULL,
      tag_name TEXT NOT NULL,
      usage_count INTEGER NOT NULL,
      color_index INTEGER NOT NULL,
      synced_at TEXT NOT NULL,
      PRIMARY KEY (category, tag_name)
    );
    CREATE TABLE IF NOT EXISTS wecom_sync_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 0,
      schedule_mode TEXT NOT NULL DEFAULT 'daily',
      interval_minutes INTEGER NOT NULL DEFAULT 60,
      hour INTEGER NOT NULL DEFAULT 2,
      minute INTEGER NOT NULL DEFAULT 0,
      next_run_at TEXT NOT NULL DEFAULT '',
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
  ensureCustomerColumn(database, "follow_user_avatar")
  ensureCustomerColumn(database, "remark_corp_name")
  ensureSyncSettingsColumn(
    database,
    "schedule_mode",
    "TEXT NOT NULL DEFAULT 'daily'"
  )
  ensureSyncSettingsColumn(
    database,
    "interval_minutes",
    "INTEGER NOT NULL DEFAULT 60"
  )
  ensureSyncSettingsColumn(database, "next_run_at", "TEXT NOT NULL DEFAULT ''")
  return database
}

function ensureSyncSettingsColumn(
  database: Database,
  column: "interval_minutes" | "next_run_at" | "schedule_mode",
  definition: string
) {
  const columns = database
    .prepare("PRAGMA table_info(wecom_sync_settings)")
    .all() as Array<{ name: string }>
  if (!columns.some((item) => item.name === column)) {
    try {
      database.exec(
        `ALTER TABLE wecom_sync_settings ADD COLUMN ${column} ${definition}`
      )
    } catch (error) {
      const refreshedColumns = database
        .prepare("PRAGMA table_info(wecom_sync_settings)")
        .all() as Array<{ name: string }>
      if (!refreshedColumns.some((item) => item.name === column)) throw error
    }
  }
}

function ensureCustomerColumn(
  database: Database,
  column: "follow_user_avatar" | "remark_corp_name"
) {
  const columns = database
    .prepare("PRAGMA table_info(wecom_customers)")
    .all() as Array<{
    name: string
  }>
  if (!columns.some((item) => item.name === column)) {
    try {
      database.exec(`ALTER TABLE wecom_customers ADD COLUMN ${column} TEXT`)
    } catch (error) {
      const refreshedColumns = database
        .prepare("PRAGMA table_info(wecom_customers)")
        .all() as Array<{ name: string }>
      if (!refreshedColumns.some((item) => item.name === column)) throw error
    }
  }
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
