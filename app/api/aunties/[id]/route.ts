import { readCmsContent, toPublicContent } from "@/lib/cms-store"
import type { CmsTeamMember } from "@/types/cms"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const content = await readCmsContent()
  const auntie = toPublicContent(content).teamMembers.find(
    (member) => member.id === id
  )

  if (!auntie) {
    return Response.json(
      { error: "auntie_not_found", message: "Auntie was not found." },
      { status: 404 }
    )
  }

  const summary = {
    avatar: auntie.avatar,
    avatarThumb: auntie.avatarThumb,
    completedCount: auntie.completedCount,
    id: auntie.id,
    name: auntie.name,
    rating: auntie.rating,
    role: auntie.role,
    status: auntie.status,
  } as CmsTeamMember

  return Response.json(summary)
}
