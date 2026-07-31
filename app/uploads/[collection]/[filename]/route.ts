import fs from "node:fs/promises"
import path from "node:path"

const allowedCollections = new Set(["blog", "gallery", "pages", "reviews"])
const contentTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ collection: string; filename: string }> }
) {
  const { collection, filename } = await context.params
  const extension = path.extname(filename).toLowerCase()

  if (
    !allowedCollections.has(collection) ||
    !contentTypes[extension] ||
    path.basename(filename) !== filename
  ) {
    return new Response("Not found", { status: 404 })
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    collection,
    filename
  )

  try {
    const file = await fs.readFile(filePath)

    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[extension],
      },
    })
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return new Response("Not found", { status: 404 })
    }

    console.error("[uploads] file read failed:", error)
    return new Response("Unable to read upload", { status: 500 })
  }
}
