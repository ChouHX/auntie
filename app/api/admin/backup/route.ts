import type { NextRequest } from "next/server"

import {
  backupCmsDatabase,
  isAdminToken,
  restoreCmsDatabase,
} from "@/lib/cms-store"

export const runtime = "nodejs"

const maxBackupBytes = 100 * 1024 * 1024

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return isAdminToken(token ?? null)
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json(
      { error: "unauthorized", message: "Admin authentication is required." },
      { status: 401 }
    )
  }

  try {
    const backup = await backupCmsDatabase()
    const date = new Date().toISOString().slice(0, 10)
    return new Response(backup, {
      headers: {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="auntie-chen-backup-${date}.db"`,
        "content-length": String(backup.byteLength),
        "content-type": "application/vnd.sqlite3",
      },
    })
  } catch (error) {
    return Response.json(
      {
        error: "backup_export_failed",
        message:
          error instanceof Error ? error.message : "数据库备份导出失败。",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json(
      { error: "unauthorized", message: "Admin authentication is required." },
      { status: 401 }
    )
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > maxBackupBytes) {
    return Response.json(
      { error: "backup_too_large", message: "备份文件超过大小限制。" },
      { status: 413 }
    )
  }

  try {
    const body = new Uint8Array(await request.arrayBuffer())
    await restoreCmsDatabase(body)
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json(
      {
        error: "backup_import_failed",
        message:
          error instanceof Error ? error.message : "数据库备份导入失败。",
      },
      { status: 400 }
    )
  }
}
