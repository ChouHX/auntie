import {
  ArrowCounterClockwise,
  CaretLeft,
  CaretRight,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  X,
} from "@phosphor-icons/react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { PointerEvent, WheelEvent } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ImagePreviewItem = {
  alt: string
  src: string
}

type ImagePreviewerProps = {
  className?: string
  images: ImagePreviewItem[]
  onOpenChange: (index: number | null) => void
  openIndex: number | null
}

type DragState = {
  offsetX: number
  offsetY: number
  pointerId: number
  startX: number
  startY: number
}

const MAX_SCALE = 3
const MIN_SCALE = 1

function ImagePreviewer({
  className,
  images,
  onOpenChange,
  openIndex,
}: ImagePreviewerProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [scale, setScale] = useState(1)
  const closeTimerRef = useRef<number | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const scaleRef = useRef(1)

  const activeIndex =
    openIndex === null
      ? -1
      : Math.min(Math.max(openIndex, 0), images.length - 1)
  const activeImage = images[activeIndex]
  const canNavigate = images.length > 1
  const isOpen = openIndex !== null && Boolean(activeImage)
  const zoomPercent = useMemo(() => Math.round(scale * 100), [scale])

  const applyTransform = useCallback(() => {
    const image = imageRef.current

    if (!image) {
      return
    }

    image.style.setProperty("--preview-x", `${offsetRef.current.x}px`)
    image.style.setProperty("--preview-y", `${offsetRef.current.y}px`)
    image.style.setProperty("--preview-scale", String(scaleRef.current))
  }, [])

  const scheduleTransform = useCallback(() => {
    if (rafRef.current !== null) {
      return
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      applyTransform()
    })
  }, [applyTransform])

  const resetView = useCallback(() => {
    scaleRef.current = 1
    offsetRef.current = { x: 0, y: 0 }
    setScale(1)
    dragStateRef.current = null
    applyTransform()
  }, [applyTransform])

  const requestClose = useCallback(() => {
    if (isClosing) {
      return
    }

    setIsClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      resetView()
      setIsClosing(false)
      closeTimerRef.current = null
      onOpenChange(null)
    }, 170)
  }, [isClosing, onOpenChange, resetView])

  const goTo = useCallback(
    (nextIndex: number) => {
      if (!images.length) {
        return
      }

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }

      setIsClosing(false)
      const normalizedIndex = (nextIndex + images.length) % images.length
      resetView()
      onOpenChange(normalizedIndex)
    },
    [images.length, onOpenChange, resetView]
  )

  const zoomTo = useCallback((nextScale: number) => {
    const normalizedScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Number(nextScale.toFixed(2)))
    )

    scaleRef.current = normalizedScale

    if (normalizedScale <= MIN_SCALE) {
      offsetRef.current = { x: 0, y: 0 }
    }

    setScale(normalizedScale)
    scheduleTransform()
  }, [scheduleTransform])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose()
        return
      }

      if (event.key === "ArrowLeft") {
        goTo(activeIndex - 1)
        return
      }

      if (event.key === "ArrowRight") {
        goTo(activeIndex + 1)
        return
      }

      if (event.key === "+" || event.key === "=") {
        zoomTo(scaleRef.current + 0.25)
        return
      }

      if (event.key === "-") {
        zoomTo(scaleRef.current - 0.25)
        return
      }

      if (event.key === "0") {
        resetView()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, goTo, isOpen, requestClose, resetView, zoomTo])

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    },
    []
  )

  useEffect(() => {
    if (!activeImage) {
      return
    }

    const indexesToPreload = [
      activeIndex,
      (activeIndex + 1) % images.length,
      (activeIndex - 1 + images.length) % images.length,
    ]

    indexesToPreload.forEach((index) => {
      const src = images[index]?.src

      if (!src || previewedImages.has(src)) {
        return
      }

      previewedImages.add(src)
      const image = new Image()
      image.decoding = "async"
      image.src = src
    })
  }, [activeImage, activeIndex, images])

  if (!isOpen || !activeImage) {
    return null
  }

  function handlePointerDown(event: PointerEvent<HTMLImageElement>) {
    if (scaleRef.current <= 1) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLImageElement>) {
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    offsetRef.current = {
      x: dragState.offsetX + event.clientX - dragState.startX,
      y: dragState.offsetY + event.clientY - dragState.startY,
    }
    scheduleTransform()
  }

  function handlePointerUp(event: PointerEvent<HTMLImageElement>) {
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    dragStateRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    zoomTo(scaleRef.current + (event.deltaY > 0 ? -0.12 : 0.12))
  }

  return createPortal(
    <div
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-[110] flex bg-slate-950/92 text-white",
        isClosing ? "animate-image-preview-out" : "animate-image-preview-in",
        className
      )}
      data-state={isClosing ? "closed" : "open"}
      role="dialog"
    >
      <button
        aria-label="关闭大图"
        className="absolute inset-0 cursor-zoom-out"
        onClick={requestClose}
        type="button"
      />

      <div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-2xl image-preview-chrome">
        {activeIndex + 1} / {images.length}
      </div>

      <Button
        aria-label="关闭大图"
        className="absolute top-4 right-4 z-20 rounded-full border-white/10 bg-white/10 text-white shadow-2xl hover:bg-white/18 image-preview-chrome"
        onClick={requestClose}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X size={20} weight="bold" />
      </Button>

      {canNavigate ? (
        <>
          <Button
            aria-label="上一张"
            className="absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full border-white/10 bg-white/10 text-white shadow-2xl hover:bg-white/18 sm:left-5 image-preview-chrome"
            onClick={() => goTo(activeIndex - 1)}
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <CaretLeft size={24} weight="bold" />
          </Button>
          <Button
            aria-label="下一张"
            className="absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full border-white/10 bg-white/10 text-white shadow-2xl hover:bg-white/18 sm:right-5 image-preview-chrome"
            onClick={() => goTo(activeIndex + 1)}
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <CaretRight size={24} weight="bold" />
          </Button>
        </>
      ) : null}

      <div
        className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-20 sm:px-8"
        onClick={requestClose}
      >
        <div
          className="image-preview-matte max-h-[calc(100dvh-10rem)] max-w-[calc(100dvw-2rem)] overflow-hidden rounded-2xl border border-white/20 p-2 shadow-[0_28px_90px_rgb(0_0_0/0.48)] sm:max-w-[calc(100dvw-4rem)] sm:p-3"
          onClick={(event) => event.stopPropagation()}
          onWheel={handleWheel}
        >
          <img
            key={activeImage.src}
            ref={imageRef}
            src={activeImage.src}
            alt={activeImage.alt}
            className={cn(
              "image-preview-image block max-h-[calc(100dvh-12rem)] max-w-[calc(100dvw-3rem)] select-none rounded-xl bg-white object-contain sm:max-w-[calc(100dvw-6rem)]",
              scale > 1 && "cursor-grab active:cursor-grabbing",
              scale <= 1 && "cursor-zoom-in"
            )}
            decoding="async"
            draggable={false}
            onDoubleClick={() =>
              scaleRef.current > 1 ? resetView() : zoomTo(2)
            }
            onPointerCancel={handlePointerUp}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              transform:
                "translate3d(var(--preview-x, 0px), var(--preview-y, 0px), 0) scale(var(--preview-scale, 1))",
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-white/10 px-2 py-2 text-white shadow-2xl image-preview-chrome">
        <Button
          aria-label="缩小"
          className="rounded-full text-white hover:bg-white/16"
          onClick={() => zoomTo(scaleRef.current - 0.25)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <MagnifyingGlassMinus size={20} weight="bold" />
        </Button>
        <Button
          aria-label="重置缩放"
          className="h-10 rounded-full px-3 text-white hover:bg-white/16"
          onClick={resetView}
          type="button"
          variant="ghost"
        >
          <ArrowCounterClockwise size={18} weight="bold" />
          <span className="min-w-10 text-sm font-semibold">{zoomPercent}%</span>
        </Button>
        <Button
          aria-label="放大"
          className="rounded-full text-white hover:bg-white/16"
          onClick={() => zoomTo(scaleRef.current + 0.25)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <MagnifyingGlassPlus size={20} weight="bold" />
        </Button>
      </div>
    </div>,
    document.body
  )
}

const previewedImages = new Set<string>()

export { ImagePreviewer }
