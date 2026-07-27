import { readCmsContent, toPublicContent } from "@/lib/cms-store"
import { getEligibleAuntiesForArea } from "@/lib/auntie-assignment"
import type { CmsTeamMember } from "@/types/cms"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const area = url.searchParams.get("area") ?? ""

  if (!area.trim()) {
    return Response.json(
      { error: "missing_area", message: "Area parameter is required." },
      { status: 400 }
    )
  }

  const content = await readCmsContent()
  const publicContent = toPublicContent(content)
  const aunties = getEligibleAuntiesForArea(
    publicContent.teamMembers,
    area,
    { onlyAvailable: false }
  )

  // Only return fields needed by the booking UI — strip PII (phone) and
  // internal fields (currentOrder, joinedAt, area, serviceAreas) that
  // are not used client-side when aunties are pre-filtered by area.
  const summaries = aunties.map(({ id, name, avatar, avatarThumb, role, status, completedCount, rating }) => ({
    avatar,
    avatarThumb,
    completedCount,
    id,
    name,
    rating,
    role,
    status,
  })) as CmsTeamMember[]

  return Response.json(summaries)
}
