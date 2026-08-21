import type { CmsPaymentProof } from "@/types/cms"

const maxPaymentProofBytes = 8 * 1024 * 1024
const allowedPaymentProofTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])

async function createPaymentProof(file: File): Promise<CmsPaymentProof> {
  if (!allowedPaymentProofTypes.has(file.type)) {
    throw new Error("付款凭证仅支持 JPG、PNG、WebP 或 GIF 图片。")
  }
  if (file.size > maxPaymentProofBytes) {
    throw new Error("付款凭证不能超过 8MB。")
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64")
  return {
    dataUrl: `data:${file.type};base64,${data}`,
    fileName: file.name.slice(0, 160),
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
  }
}

export { createPaymentProof, maxPaymentProofBytes }
