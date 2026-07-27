import { useEffect, useMemo, useState } from "react"

import { defaultCmsContent } from "@/data/cms-defaults"
import {
  fetchPublicContent,
  type PublicContentSection,
} from "@/lib/cms-api"
import type { CmsContent } from "@/types/cms"

type CmsContentState = {
  content: CmsContent
  error: string | null
  isLoading: boolean
  source: "api" | "fallback"
}

let cachedContent: CmsContent = defaultCmsContent
let cachedError: string | null = null
const loadedSections = new Set<PublicContentSection>()
const sectionRequests = new Map<string, Promise<CmsContent>>()

function useCmsContent(sections: PublicContentSection[]) {
  const sectionKey = useMemo(
    () => Array.from(new Set(sections)).sort().join(","),
    [sections]
  )
  const requestedSections = useMemo(
    () => sectionKey.split(",").filter(Boolean) as PublicContentSection[],
    [sectionKey]
  )
  const [state, setState] = useState<CmsContentState>({
    content: cachedContent,
    error: cachedError,
    isLoading:
      requestedSections.some((section) => !loadedSections.has(section)) &&
      !cachedError,
    source: loadedSections.size > 0 ? "api" : "fallback",
  })

  useEffect(() => {
    let isMounted = true
    const request = getPublicContentRequest(requestedSections)

    request
      .then((content) => {
        if (!isMounted) {
          return
        }

        setState({
          content,
          error: null,
          isLoading: false,
          source: "api",
        })
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return
        }

        cachedError = error.message
        setState({
          content: defaultCmsContent,
          error: error.message,
          isLoading: false,
          source: "fallback",
        })
      })

    return () => {
      isMounted = false
    }
  }, [requestedSections])

  return state
}

function getPublicContentRequest(sections: PublicContentSection[]) {
  const missingSections = sections.filter(
    (section) => !loadedSections.has(section)
  )

  if (missingSections.length === 0) {
    return Promise.resolve(cachedContent)
  }

  const requestKey = missingSections.toSorted().join(",")
  const existingRequest = sectionRequests.get(requestKey)

  if (existingRequest) {
    return existingRequest
  }

  const request = fetchPublicContent(missingSections)
    .then((partial) => {
      cachedContent = {
        ...cachedContent,
        ...partial,
      }
      missingSections.forEach((section) => loadedSections.add(section))
      cachedError = null
      return cachedContent
    })
    .catch((error) => {
      sectionRequests.delete(requestKey)
      throw error
    })

  sectionRequests.set(requestKey, request)

  return request
}

function resetCmsContentCache() {
  cachedContent = defaultCmsContent
  cachedError = null
  loadedSections.clear()
  sectionRequests.clear()
}

export { resetCmsContentCache, useCmsContent }
