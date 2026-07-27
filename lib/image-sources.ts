import type { CmsGalleryItem } from "@/types/cms"

type ResolvedImageSources = {
  detailSrc: string
  thumbnailSrc: string
}

function resolveGalleryImageSources(
  item: CmsGalleryItem
): ResolvedImageSources {
  return {
    detailSrc: item.detailSrc || item.src,
    thumbnailSrc: item.thumbnailSrc || item.src,
  }
}

function resolveReviewImageSources(item: CmsGalleryItem): ResolvedImageSources {
  return {
    detailSrc: item.detailSrc || deriveReviewDetailSrc(item.src),
    thumbnailSrc: item.thumbnailSrc || item.src,
  }
}

function deriveReviewDetailSrc(src: string) {
  const match = src.match(
    /^\/review-screenshots\/display\/review-(\d{2})\.jpg$/
  )

  if (!match) {
    return src
  }

  const reviewNumber = Number(match[1])
  const extension = reviewNumber <= 25 ? "png" : "jpg"

  return `/review-screenshots/review-${match[1]}.${extension}`
}

export { resolveGalleryImageSources, resolveReviewImageSources }
