import { useMemo, useState } from "react"
import { MagnifyingGlassPlus } from "@phosphor-icons/react"

import { ImagePreviewer } from "@/components/ui/image-previewer"
import { cn } from "@/lib/utils"
import type { CmsGalleryItem } from "@/types/cms"

type GalleryImage = {
  alt: string
  index: number
  src: string
}

type ImageGalleryProps = {
  className?: string
  items: CmsGalleryItem[]
}

function ImageGallery({ className, items }: ImageGalleryProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const galleryImages = useMemo(
    () =>
      items
        .filter((item) => item.status === "published")
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map((item, index) => ({
          alt: `画廊图片 ${index + 1}`,
          index,
          src: item.src,
        })),
    [items]
  )

  return (
    <div className={cn("relative w-full", className)}>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 lg:gap-4">
        {galleryImages.map((image, imageIndex) => (
          <GalleryImageCard
            eager={imageIndex < 4}
            image={image}
            key={image.src}
            onOpen={setPreviewIndex}
          />
        ))}
      </div>

      <ImagePreviewer
        images={galleryImages}
        onOpenChange={setPreviewIndex}
        openIndex={previewIndex}
      />
    </div>
  )
}

type GalleryImageCardProps = {
  eager: boolean
  image: GalleryImage
  onOpen: (index: number) => void
}

function GalleryImageCard({ eager, image, onOpen }: GalleryImageCardProps) {
  return (
    <button
      aria-label={`查看${image.alt}`}
      className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted text-left shadow-sm shadow-blue-100/30 transition-[filter,box-shadow] duration-300 hover:shadow-lg hover:shadow-blue-100/45 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none sm:aspect-[4/5] dark:bg-slate-900 dark:shadow-none dark:focus-visible:ring-blue-300"
      onClick={() => onOpen(image.index)}
      onFocus={() => preloadGalleryImage(image.src)}
      onPointerEnter={() => preloadGalleryImage(image.src)}
      type="button"
    >
      <img
        src={image.src}
        alt={image.alt}
        className="block size-full object-cover"
        decoding="async"
        fetchPriority={eager ? "high" : "low"}
        loading={eager ? "eager" : "lazy"}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/0 opacity-0 transition duration-300 group-hover:bg-slate-950/35 group-hover:opacity-100 group-focus-visible:bg-slate-950/35 group-focus-visible:opacity-100">
        <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-blue-700 shadow-xl shadow-slate-950/25 sm:size-12">
          <MagnifyingGlassPlus
            aria-hidden="true"
            className="size-5 sm:size-6"
            weight="bold"
          />
        </span>
      </span>
    </button>
  )
}

function preloadGalleryImage(src?: string) {
  if (!src || preloadedGalleryImages.has(src)) {
    return
  }

  preloadedGalleryImages.add(src)
  const image = new Image()
  image.decoding = "async"
  image.src = src
}

const preloadedGalleryImages = new Set<string>()

export { ImageGallery }
