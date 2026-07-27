/**
 * Frontend-only showcase stubs.
 * Forms stay visible for demo, but do not call backend APIs.
 */

type PublicFormType = "estimate" | "join"
type PublicFormPayload = Record<string, boolean | string | string[]>

async function submitPublicForm(
  _type: PublicFormType,
  _payload: PublicFormPayload
) {
  // Showcase mode intentionally does not persist submissions.
  return { ok: true as const }
}

export { submitPublicForm }
