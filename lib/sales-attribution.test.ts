import assert from "node:assert/strict"
import test from "node:test"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const attribution = await import("./sales-attribution.ts")
const { findSalesMemberForStudentTags } = attribution

const members = [
  {
    commissionPercentage: 5,
    createdAt: "",
    id: "sales-a",
    name: "销售 A",
    status: "active" as const,
    studentTag: "学员 A",
    updatedAt: "",
  },
]

test("通过学员分区标签查找绑定销售", () => {
  assert.equal(
    findSalesMemberForStudentTags("学员 B, 学员 A", members)?.name,
    "销售 A"
  )
})

test("忽略未绑定标签和停用销售", () => {
  assert.equal(findSalesMemberForStudentTags("学员 B", members), undefined)
  assert.equal(
    findSalesMemberForStudentTags("学员 A", [
      { ...members[0], status: "inactive" },
    ]),
    undefined
  )
})
