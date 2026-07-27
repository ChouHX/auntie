import { readCmsContent, toPublicContent } from "@/lib/cms-store"
import type { CmsTeamMember } from "@/types/cms"

export async function GET() {
  const content = await readCmsContent()
  const aunties = toPublicContent(content).teamMembers
    .toSorted((left, right) => {
      if (right.rating !== left.rating) {
        return right.rating - left.rating
      }

      return right.completedCount - left.completedCount
    })
    .slice(0, 12)
    .map(({ avatar, avatarThumb, completedCount, id, name, rating, role, status }) => ({
      avatar,
      avatarThumb,
      completedCount,
      id,
      name,
      rating,
      role,
      status,
    })) as CmsTeamMember[]

  return Response.json(aunties, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  })
}
