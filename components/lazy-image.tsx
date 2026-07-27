import { useCallback, useRef, useState } from "react"
import { useInView } from "motion/react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "@/lib/utils"

type LazyImageProps = {
  alt: string
  className?: string
  containerClassName?: string
  fallback?: string
  inView?: boolean
  ratio: number
  src: string
}

function LazyImage({
  alt,
  src,
  ratio,
  fallback,
  inView = false,
  className,
  containerClassName,
}: LazyImageProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true })
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const shouldLoad = !inView || isInView
  const imgSrc = shouldLoad ? getImageSrc(src, fallback, failedSrc) : undefined
  const isLoading = Boolean(imgSrc && loadedSrc !== imgSrc)

  const handleError = useCallback(() => {
    setFailedSrc(src)
  }, [src])

  const handleLoad = useCallback(() => {
    if (imgSrc) {
      setLoadedSrc(imgSrc)
    }
  }, [imgSrc])

  return (
    <AspectRatio
      className={cn(
        "relative size-full overflow-hidden border bg-accent/30",
        containerClassName
      )}
      ratio={ratio}
      ref={ref}
    >
      {imgSrc ? (
        <img
          alt={alt}
          className={cn(
            "size-full object-cover transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          decoding="async"
          fetchPriority={inView ? "low" : "high"}
          loading={inView ? "lazy" : "eager"}
          onError={handleError}
          onLoad={handleLoad}
          src={imgSrc}
        />
      ) : null}
    </AspectRatio>
  )
}

function getImageSrc(src: string, fallback: string | undefined, failedSrc: string | null) {
  if (failedSrc === src && fallback) {
    return fallback
  }

  return src
}

export { LazyImage }
