"use client"

import { useEffect } from "react"

import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"
import { getSiteLogo } from "@/lib/site-settings"

const htmlLang = {
  en: "en",
  zh: "zh-CN",
} as const

function SiteHeadSync() {
  const { content } = useCmsContent(["siteSettings"])
  const { dict, language } = useI18n()
  const logoImage = getSiteLogo(content)

  useEffect(() => {
    const title = dict.common.siteTitle

    document.documentElement.lang = htmlLang[language]
    document.title = title
    upsertMeta("description", dict.common.siteDescription)
    upsertIcon(logoImage)
  }, [dict.common.siteDescription, dict.common.siteTitle, language, logoImage])

  return null
}

function upsertMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!element) {
    element = document.createElement("meta")
    element.name = name
    document.head.appendChild(element)
  }

  element.content = content
}

function upsertIcon(href: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

  if (!element) {
    element = document.createElement("link")
    element.rel = "icon"
    document.head.appendChild(element)
  }

  element.href = href
}

export { SiteHeadSync }
