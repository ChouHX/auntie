import type { CmsSalesMember } from "@/types/cms"

function findSalesMemberForStudentTags(
  value: string | undefined,
  members: CmsSalesMember[]
) {
  const tags = new Set(
    String(value ?? "")
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  )
  return members.find(
    (member) => member.status === "active" && tags.has(member.studentTag)
  )
}

export { findSalesMemberForStudentTags }
