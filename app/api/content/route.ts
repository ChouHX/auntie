import type { NextRequest } from "next/server"

import { readCmsContent, toPublicContent } from "@/lib/cms-store"
import type { CmsContent } from "@/types/cms"

const publicContentSections = new Set([
  "afterSalesPage",
  "bookingConfigs",
  "blogCategories",
  "blogPosts",
  "contactPage",
  "faq",
  "galleryItems",
  "paymentSettings",
  "reviewItems",
  "serviceRegions",
  "serviceLocations",
  "siteSettings",
])

export async function GET(request: NextRequest) {
  const sectionsParam = request.nextUrl.searchParams.get("sections")

  if (!sectionsParam) {
    return Response.json(
      {
        error: "sections_required",
        message: "Request at least one public content section.",
      },
      { status: 400 }
    )
  }

  const content = await readCmsContent()
  const publicContent = toPublicContent(content)

  const requestedSections = sectionsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const validSections = requestedSections.filter((s) =>
    publicContentSections.has(s)
  )

  const partial: Partial<CmsContent> = {
    updatedAt: publicContent.updatedAt,
    version: publicContent.version,
  }

  for (const section of validSections) {
    ;(partial as Record<string, unknown>)[section] = (
      publicContent as Record<string, unknown>
    )[section]
  }

  return Response.json(partial)
}
