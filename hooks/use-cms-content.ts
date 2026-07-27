import { useMemo } from "react"

import { defaultCmsContent } from "@/data/cms-defaults"
import type { CmsContent } from "@/types/cms"

type CmsContentState = {
  content: CmsContent
  error: string | null
  isLoading: boolean
  source: "api" | "fallback"
}

/**
 * Showcase build is frontend-only: always return local default content.
 * No network CMS fetch and no admin write path.
 */
function useCmsContent(): CmsContentState {
  return useMemo(
    () => ({
      content: defaultCmsContent,
      error: null,
      isLoading: false,
      source: "fallback",
    }),
    []
  )
}

function resetCmsContentCache() {
  // No-op: showcase content is static.
}

export { resetCmsContentCache, useCmsContent }
