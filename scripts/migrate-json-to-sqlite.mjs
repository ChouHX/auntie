import fs from "node:fs/promises"
import path from "node:path"

const dataDirectory = process.env.CMS_DATA_DIRECTORY || path.join(process.cwd(), "data")
const jsonFile = process.env.CMS_JSON_FILE || path.join(dataDirectory, "cms-content.json")
const sqliteFile = process.env.CMS_SQLITE_FILE || path.join(dataDirectory, "cms.sqlite")
const force = process.argv.includes("--force")

const rawContent = await fs.readFile(jsonFile, "utf8")
const content = JSON.parse(rawContent)

if (!content || typeof content !== "object" || Array.isArray(content)) {
  throw new Error(`Invalid CMS JSON object: ${jsonFile}`)
}

await fs.mkdir(path.dirname(sqliteFile), { recursive: true })

const { DatabaseSync } = await import("node:sqlite")
const database = new DatabaseSync(sqliteFile)

try {
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cms_content (
      id INTEGER PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  const existing = database
    .prepare("SELECT id FROM cms_content WHERE id = 1")
    .get()

  if (existing && !force) {
    throw new Error(
      `SQLite CMS already contains data at ${sqliteFile}. Use --force only after making a backup.`
    )
  }

  const updatedAt =
    typeof content.updatedAt === "string" && content.updatedAt
      ? content.updatedAt
      : new Date().toISOString()

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
    .run(JSON.stringify(content), updatedAt)
} finally {
  database.close()
}

console.log(
  JSON.stringify({
    force,
    jsonFile,
    orderCount: Array.isArray(content.paymentOrders)
      ? content.paymentOrders.length
      : 0,
    sqliteFile,
    updatedAt: content.updatedAt || null,
    migrated: true,
  })
)
