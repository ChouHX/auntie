/**
 * Generate thumbnails and optimized versions for gold auntie images.
 *
 * Run with: node scripts/generate-gold-auntie-thumbs.mjs
 *
 * This script reads the original gold-auntie-XX.png files (1.7MB each)
 * and generates:
 *   - gold-auntie-XX-thumb.webp  (240x300, ~20KB, for marquee/list)
 *   - gold-auntie-XX-detail.webp (800x1000, ~100KB, for detail views)
 *
 * The originals are kept as-is.
 */

import fs from "node:fs"
import path from "node:path"

let sharp
try {
  sharp = (await import("sharp")).default
} catch {
  console.error("Error: sharp is not available. Install with: pnpm add sharp")
  process.exit(1)
}

const inputDir = path.join(process.cwd(), "public", "gold-aunties")
const files = fs
  .readdirSync(inputDir)
  .filter((f) => /^gold-auntie-\d+\.png$/.test(f))
  .sort()

console.log(`Found ${files.length} gold auntie images`)

for (const file of files) {
  const inputPath = path.join(inputDir, file)
  const baseName = file.replace(".png", "")

  // Thumbnail: 240x300 (2x for retina), WebP, quality 80
  const thumbPath = path.join(inputDir, `${baseName}-thumb.webp`)
  await sharp(inputPath)
    .resize(240, 300, { fit: "cover", position: "center" })
    .webp({ quality: 80 })
    .toFile(thumbPath)

  // Detail: 800x1000, WebP, quality 85
  const detailPath = path.join(inputDir, `${baseName}-detail.webp`)
  await sharp(inputPath)
    .resize(800, 1000, { fit: "cover", position: "center" })
    .webp({ quality: 85 })
    .toFile(detailPath)

  const thumbSize = fs.statSync(thumbPath).size
  const detailSize = fs.statSync(detailPath).size
  const originalSize = fs.statSync(inputPath).size
  console.log(
    `  ${file}: ${(originalSize / 1024).toFixed(0)}KB → thumb ${(thumbSize / 1024).toFixed(0)}KB, detail ${(detailSize / 1024).toFixed(0)}KB`
  )
}

console.log("Done! Thumbnails and detail images generated.")
