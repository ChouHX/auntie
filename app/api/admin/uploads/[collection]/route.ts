import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import type { NextRequest } from "next/server"

import { isAdminToken } from "@/lib/cms-store"

const allowedCollections = new Set(["blog", "gallery", "pages", "reviews"])
const allowedExtensions = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"])
const allowedTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ collection: string }> }
) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!isAdminToken(token ?? null)) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Admin authentication is required.",
      },
      { status: 401 }
    )
  }

  const { collection } = await context.params

  if (!allowedCollections.has(collection)) {
    return Response.json(
      {
        error: "invalid_collection",
        message: "Invalid upload collection.",
      },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return Response.json(
      {
        error: "missing_file",
        message: "Image file is required.",
      },
      { status: 400 }
    )
  }

  const extension = path.extname(file.name).toLowerCase()

  if (!allowedExtensions.has(extension) || !allowedTypes.has(file.type)) {
    return Response.json(
      {
        error: "unsupported_image",
        message: "Only jpg, png, webp, and gif images are supported.",
      },
      { status: 400 }
    )
  }

  const filename = `${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}${extension === ".jpeg" ? ".jpg" : extension}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", collection)
  const filePath = path.join(uploadDir, filename)
  const data = Buffer.from(await file.arrayBuffer())

  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(filePath, data)

  // Generate thumbnail using sharp (240x300 WebP, quality 80)
  const thumbFilename = `${filename}-thumb.webp`
  const thumbPath = path.join(uploadDir, thumbFilename)
  let thumbSrc: string | null = null

  try {
    const sharp = (await import("sharp")).default
    await sharp(data)
      .resize(240, 300, { fit: "cover", position: "center" })
      .webp({ quality: 80 })
      .toFile(thumbPath)
    thumbSrc = `/uploads/${collection}/${thumbFilename}`
  } catch (err) {
    // Sharp not available or resize failed — continue without thumbnail
    console.warn("[uploads] thumbnail generation failed:", err)
  }

  return Response.json(
    {
      filename,
      size: data.length,
      src: `/uploads/${collection}/${filename}`,
      thumbSrc,
      type: file.type,
    },
    { status: 201 }
  )
}
