import { defaultCmsContent } from "@/data/cms-defaults"
import type { CmsContent } from "@/types/cms"

function getSiteLogo(content?: Pick<CmsContent, "siteSettings"> | null) {
  return (
    content?.siteSettings?.logoImage?.trim() ||
    defaultCmsContent.siteSettings.logoImage
  )
}

export { getSiteLogo }
