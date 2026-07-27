import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { MapPin, Sparkle } from "@phosphor-icons/react"

import { type ServiceLocation, type ServiceRegion } from "@/data/site"
import { defaultCmsContent } from "@/data/cms-defaults"
import { useCmsContent } from "@/hooks/use-cms-content"
import { regionsWithDerivedCities } from "@/lib/service-regions"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/* ── Types ─────────────────────────────────────────── */

type ServiceGlobeProps = {
  activeLocation?: ServiceLocation
  header?: ReactNode
  locations: readonly ServiceLocation[]
  onLocationChange: (locationId: string) => void
}

type FlatServiceMapProps = {
  activeLocation?: ServiceLocation
  activeRegion: ServiceRegion
  focusedRegionId: string | null
  locations: readonly ServiceLocation[]
  onLocationChange: (locationId: string) => void
  onRegionFocus: (regionId: string | null) => void
  regions: readonly ServiceRegion[]
}

type FlatMapPath = {
  d: string
  id: string
  isServiceRegion: boolean
  region?: ServiceRegion
}

type CountryFeatureCollection = {
  features?: Array<{
    geometry?: {
      coordinates?: unknown
      type?: string
    }
    properties?: Record<string, string | number | null | undefined>
  }>
}

/* ── Constants ─────────────────────────────────────── */

const MAP_WIDTH = 1400
const MAP_HEIGHT = 700
const LAT_MIN = -58
const LAT_MAX = 82
const LATITUDE_CUT_PADDING = 8
const DATELINE_SPLIT_DEGREES = 180
const SERVICE_AREA_COUNT = 100

const SERVICE_GLOBE_STYLES = `
  .service-globe-root {
    --map-ocean: #e7f4ff;
    --map-country-fill: #d1dfeb;
    --map-country-stroke: rgba(128, 151, 171, 0.55);
    --map-region-fill: rgba(102, 164, 255, 0.58);
    --map-region-stroke: rgba(57, 127, 255, 0.68);
    --map-region-hover-fill: rgba(57, 127, 255, 0.82);
    --map-region-hover-stroke: #245ef4;
    --map-service-point: #245ef4;
    --map-graticule: rgba(0, 0, 0, 0.06);
  }

  .dark .service-globe-root {
    --map-ocean: #071426;
    --map-country-fill: rgba(30, 41, 59, 0.86);
    --map-country-stroke: rgba(100, 116, 139, 0.34);
    --map-region-fill: rgba(30, 96, 210, 0.76);
    --map-region-stroke: rgba(96, 165, 250, 0.72);
    --map-region-hover-fill: rgba(59, 130, 246, 0.96);
    --map-region-hover-stroke: rgba(191, 219, 254, 0.9);
    --map-service-point: #93c5ff;
    --map-graticule: rgba(148, 163, 184, 0.06);
  }
  /* ── 地图国家路径样式 ── */
  .map-country {
    fill: var(--map-country-fill);
    stroke: var(--map-country-stroke);
    stroke-linejoin: round;
    stroke-width: 0.45;
    cursor: default;
    transition:
      fill 0.2s ease,
      opacity 0.2s ease,
      stroke 0.2s ease,
      stroke-width 0.2s ease;
  }

  .map-region {
    fill: var(--map-region-fill);
    stroke: var(--map-region-stroke);
    stroke-linejoin: round;
    stroke-width: 0.8;
    cursor: pointer;
    transition:
      fill 0.2s ease,
      opacity 0.2s ease,
      stroke 0.2s ease,
      stroke-width 0.2s ease;
  }

  .map-region:hover,
  .map-region[data-hovered="true"] {
    fill: var(--map-region-hover-fill);
    stroke: var(--map-region-hover-stroke);
    stroke-width: 1.35;
  }

  .map-region[data-active="true"] {
    fill: var(--map-region-hover-fill);
    stroke: var(--map-region-hover-stroke);
    stroke-width: 1.25;
  }

  .map-region[data-active="true"]:hover,
  .map-region[data-active="true"][data-hovered="true"] {
    stroke-width: 1.55;
  }

  /* ── 服务区域光晕 ── */
  .map-halo-glow {
    fill: var(--map-region-fill);
    opacity: 0.18;
    pointer-events: none;
  }

  .map-halo-glow[data-active="true"],
  .map-halo-glow[data-focused="true"] {
    opacity: 0.34;
  }

  .map-service-marker {
    cursor: pointer;
    transition: opacity 180ms ease;
  }

  .map-service-marker-pulse {
    fill: color-mix(in oklch, var(--primary) 24%, transparent);
    opacity: 0.42;
    transition:
      opacity 180ms ease,
      r 180ms ease;
  }

  .map-service-marker-ring {
    fill: var(--card);
    stroke: var(--map-service-point);
    stroke-width: 1.35;
    transition:
      fill 180ms ease,
      r 180ms ease,
      stroke 180ms ease,
      stroke-width 180ms ease;
  }

  .map-service-marker-dot {
    fill: var(--map-service-point);
    stroke: white;
    stroke-width: 0.85;
    transition:
      fill 180ms ease,
      r 180ms ease,
      stroke-width 180ms ease;
  }

  .map-service-marker:hover,
  .map-service-marker[data-focused="true"],
  .map-service-marker[data-active="true"] {
    opacity: 0.98;
  }

  .map-service-marker:hover .map-service-marker-pulse,
  .map-service-marker[data-focused="true"] .map-service-marker-pulse,
  .map-service-marker[data-active="true"] .map-service-marker-pulse {
    opacity: 0.68;
  }

  .map-service-marker:hover .map-service-marker-ring,
  .map-service-marker[data-focused="true"] .map-service-marker-ring,
  .map-service-marker[data-active="true"] .map-service-marker-ring {
    stroke-width: 1.65;
  }

  .map-service-marker[data-active="true"] .map-service-marker-dot {
    stroke-width: 1.1;
  }

  .globe-city-label {
    pointer-events: auto;
    border: 0;
    border-radius: 999px;
    background: rgb(15 23 42 / 0.72);
    box-shadow:
      0 10px 26px rgb(2 6 23 / 0.28),
      inset 0 0 0 1px rgb(147 197 253 / 0.16);
    color: rgb(219 234 254 / 0.88);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
    padding: 6px 9px;
    text-shadow: 0 1px 10px rgb(14 165 233 / 0.35);
    white-space: nowrap;
    transition:
      background-color 220ms ease,
      box-shadow 220ms ease,
      color 220ms ease,
      opacity 220ms ease;
  }

  .globe-city-label:hover,
  .globe-city-label[data-active="true"] {
    background: rgb(37 99 235 / 0.9);
    box-shadow:
      0 14px 34px rgb(37 99 235 / 0.34),
      inset 0 0 0 1px rgb(255 255 255 / 0.34);
    color: white;
  }

  .globe-city-label[data-active="true"] {
    font-size: 12px;
  }
`

/* ══════════════════════════════════════════════════════
   ServiceGlobe — wrapper (Card + map + card grid)
   ══════════════════════════════════════════════════════ */

function ServiceGlobe({
  activeLocation,
  header,
  locations,
  onLocationChange,
}: ServiceGlobeProps) {
  const { cityName, dict, regionName } = useI18n()
  const { content } = useCmsContent(["serviceLocations", "serviceRegions"])
  const serviceRegions = regionsWithDerivedCities(
    content.serviceRegions ?? defaultCmsContent.serviceRegions,
    content.serviceLocations ?? defaultCmsContent.serviceLocations
  )
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null)
  const center = activeLocation ?? locations[0]

  if (!center) {
    return null
  }

  const activeRegion =
    serviceRegions.find((region) => region.name === center.country) ??
    serviceRegions[0]
  const focusedRegion =
    serviceRegions.find((region) => region.id === focusedRegionId) ??
    activeRegion
  const locationCountByCountry = createLocationCountByCountry(locations)

  function handleRegionChange(regionId: string) {
    const region = serviceRegions.find((item) => item.id === regionId)
    const firstLocation = locations.find(
      (location) => location.country === region?.name
    )
    if (firstLocation) {
      setFocusedRegionId(null)
      onLocationChange(firstLocation.id)
    }
  }

  return (
    <Card className="service-globe-root animate-fade-up overflow-hidden rounded-2xl border-border/80 bg-card/95 shadow-xl shadow-blue-950/14 sm:rounded-[24px] sm:shadow-2xl sm:shadow-blue-950/18 dark:border-white/10 dark:bg-slate-950/95 dark:shadow-blue-950/50">
      <style>{SERVICE_GLOBE_STYLES}</style>
      {header ? (
        <div className="border-b border-border bg-gradient-to-r from-card via-blue-500/5 to-card px-4 py-4 sm:px-5">
          {header}
        </div>
      ) : null}

      <FlatServiceMap
        activeLocation={activeLocation}
        activeRegion={activeRegion}
        focusedRegionId={focusedRegionId}
        locations={locations}
        onLocationChange={onLocationChange}
        onRegionFocus={setFocusedRegionId}
        regions={serviceRegions}
      />

      {/* ── 紧凑式卡片网格 ── */}
      <div className="bg-gradient-to-b from-card via-card to-muted/35 px-2.5 py-3 sm:px-5 sm:py-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/70">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-0.5 sm:mb-3 sm:gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <MapPin
              className="text-blue-500 dark:text-blue-400"
              weight="fill"
            />
            {dict.areas.rangeTitle}
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              {regionName(focusedRegion.name)}
            </span>
          </div>
          <div className="hidden items-center gap-3 text-xs font-medium text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
              {serviceRegions.length} {dict.areas.rangeMeta}
            </span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-blue-300 dark:bg-blue-300" />
              {SERVICE_AREA_COUNT}+ {dict.areas.servicePoints}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 items-start gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4 xl:grid-cols-5">
          {serviceRegions.map((region) => {
            const isActive = region.id === activeRegion.id
            const isFocused = region.id === focusedRegion.id
            const count =
              locationCountByCountry.get(region.name) ?? region.cities.length
            const cityList = region.cities
              .map((city) => cityName(city))
              .join("、")
            return (
              <button
                key={region.id}
                className={cn(
                  "block min-w-0 overflow-hidden rounded-lg border px-2.5 py-2 text-left transition duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:outline-none sm:px-3",
                  isActive || isFocused
                    ? "border-blue-500/55 bg-blue-500/10 shadow-sm shadow-blue-500/10 dark:border-blue-400/60 dark:bg-blue-950/45"
                    : "border-border/80 bg-background/55 hover:border-blue-500/40 hover:bg-blue-500/5 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/80"
                )}
                aria-label={`${regionName(region.name)}，${count} ${dict.areas.cityMeta}`}
                onClick={() => handleRegionChange(region.id)}
                title={`${regionName(region.name)}：${cityList}`}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      isActive || isFocused
                        ? "bg-blue-500 dark:bg-blue-400"
                        : "bg-blue-500/60 dark:bg-blue-500/70"
                    )}
                  />
                  <span className="min-w-0 truncate text-xs font-semibold text-card-foreground">
                    {regionName(region.name)}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground">
                    {count}
                  </span>
                </span>
                <span className="mt-0.5 block min-w-0 overflow-hidden pl-4 text-[10px] leading-4 text-ellipsis whitespace-nowrap text-muted-foreground sm:mt-1 xl:text-[11px]">
                  {cityList}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════
   FlatServiceMap — SVG world map + hover tooltip
   ══════════════════════════════════════════════════════ */

function FlatServiceMap({
  activeLocation,
  activeRegion,
  focusedRegionId,
  locations,
  onLocationChange,
  onRegionFocus,
  regions,
}: FlatServiceMapProps) {
  const { cityName, dict, regionName } = useI18n()
  const [paths, setPaths] = useState<FlatMapPath[]>([])
  const [tooltipRegion, setTooltipRegion] = useState<ServiceRegion | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 16, y: 16 })
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ clientX: 0, clientY: 0 })
  const [tooltipSize, setTooltipSize] = useState({ height: 96, width: 160 })

  const serviceRegionIds = useMemo(
    () => new Set(regions.map((region) => region.id)),
    [regions]
  )

  const serviceRegionMap = useMemo(() => {
    const map = new Map<string, ServiceRegion>()
    regions.forEach((region) => {
      map.set(region.id, region)
    })
    return map
  }, [regions])

  const regionByCountryName = useMemo(() => {
    const map = new Map<string, ServiceRegion>()
    regions.forEach((region) => {
      map.set(region.name, region)
    })
    return map
  }, [regions])

  const locationCountByCountry = useMemo(
    () => createLocationCountByCountry(locations),
    [locations]
  )

  const focusedRegion =
    serviceRegionMap.get(focusedRegionId ?? "") ?? activeRegion
  const highlightedRegionId = focusedRegion.id
  const activeCountryName = activeLocation?.country

  const updateTooltipPosition = useCallback(
    (clientX: number, clientY: number) => {
      pointerRef.current = { clientX, clientY }

      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const localX = clientX - rect.left
      const localY = clientY - rect.top
      const tooltipWidth = tooltipSize.width
      const tooltipHeight = tooltipSize.height
      const preferredX =
        localX + tooltipWidth + 22 > rect.width
          ? localX - tooltipWidth - 14
          : localX + 14
      const preferredY =
        localY + tooltipHeight + 22 > rect.height
          ? localY - tooltipHeight - 14
          : localY + 14

      setTooltipPos({
        x: clamp(preferredX, 8, Math.max(8, rect.width - tooltipWidth - 8)),
        y: clamp(preferredY, 8, Math.max(8, rect.height - tooltipHeight - 8)),
      })
    },
    [tooltipSize.height, tooltipSize.width]
  )

  const selectRegion = useCallback(
    (region: ServiceRegion) => {
      const firstLocation = locations.find(
        (location) => location.country === region.name
      )

      if (firstLocation) {
        onLocationChange(firstLocation.id)
      }
    },
    [locations, onLocationChange]
  )

  useEffect(() => {
    let cancelled = false

    async function loadMap() {
      try {
        const response = await fetch("/data/countries.geojson")
        if (!response.ok) return

        const data = (await response.json()) as CountryFeatureCollection
        const nextPaths = createFlatMapPaths(
          data,
          serviceRegionIds,
          serviceRegionMap
        )

        if (!cancelled) {
          setPaths(nextPaths)
        }
      } catch {
        if (!cancelled) {
          setPaths([])
        }
      }
    }

    void loadMap()

    return () => {
      cancelled = true
    }
  }, [serviceRegionIds, serviceRegionMap])

  useEffect(() => {
    if (!tooltipRegion) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      updateTooltipPosition(event.clientX, event.clientY)
    }

    window.addEventListener("pointermove", handlePointerMove)
    return () => window.removeEventListener("pointermove", handlePointerMove)
  }, [tooltipRegion, updateTooltipPosition])

  useLayoutEffect(() => {
    if (!tooltipRegion || !tooltipRef.current) {
      return
    }

    const { height, width } = tooltipRef.current.getBoundingClientRect()
    const nextSize = {
      height: Math.ceil(height),
      width: Math.ceil(width),
    }

    setTooltipSize((current) => {
      if (
        current.height === nextSize.height &&
        current.width === nextSize.width
      ) {
        return current
      }

      return nextSize
    })

    if (pointerRef.current.clientX || pointerRef.current.clientY) {
      updateTooltipPosition(
        pointerRef.current.clientX,
        pointerRef.current.clientY
      )
    }
  }, [tooltipRegion, updateTooltipPosition])

  const focusedCount =
    locationCountByCountry.get(focusedRegion.name) ??
    focusedRegion.cities.length

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-[var(--map-ocean)]"
      onPointerMoveCapture={(event) => {
        if (!tooltipRegion) {
          return
        }

        updateTooltipPosition(event.clientX, event.clientY)
      }}
    >
      <div className="hidden border-b border-blue-500/10 bg-card/82 px-3 py-2 text-[11px] font-medium text-muted-foreground dark:bg-slate-950/72">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <Sparkle
              className="text-blue-500 dark:text-blue-400"
              weight="fill"
            />
            {regions.length} {dict.areas.rangeMeta} · {SERVICE_AREA_COUNT}+{" "}
            {dict.areas.servicePoints}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
            {dict.areas.rangeTitle}
          </span>
        </div>
      </div>

      {/* ── 顶部浮动图例：替代原先横条，避免上下双横杆 ── */}
      <div className="pointer-events-none absolute top-3 left-3 z-20 hidden max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground sm:top-4 sm:left-4 sm:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-card/96 px-2.5 py-1 shadow-sm shadow-blue-950/5 dark:bg-slate-950/90 dark:shadow-blue-950/30">
          <Sparkle className="text-blue-500 dark:text-blue-400" weight="fill" />
          {regions.length} {dict.areas.rangeMeta} · {SERVICE_AREA_COUNT}+{" "}
          {dict.areas.servicePoints}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-card/96 px-2.5 py-1 shadow-sm shadow-blue-950/5 dark:bg-slate-950/90 dark:shadow-blue-950/30">
          <span className="inline-block size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
          {dict.areas.rangeTitle}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-card/96 px-2.5 py-1 shadow-sm shadow-blue-950/5 dark:bg-slate-950/90 dark:shadow-blue-950/30">
          <span className="inline-block size-2 rounded-full border border-blue-500 bg-card shadow-[0_0_0_3px_rgba(57,127,255,0.16)] dark:border-blue-300 dark:bg-slate-950" />
          {dict.areas.cities}
        </span>
      </div>

      {/* ── 当前/hover 国家服务区域面板 ── */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden w-[min(360px,calc(100%-1.5rem))] rounded-2xl border border-blue-500/20 bg-card/96 p-3 shadow-xl shadow-blue-950/10 sm:bottom-4 sm:left-4 sm:block dark:border-blue-400/20 dark:bg-slate-950/92 dark:shadow-blue-950/50">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
          <span className="text-sm font-semibold text-card-foreground">
            {regionName(focusedRegion.name)}
          </span>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
            {focusedCount} {dict.areas.cityMeta}
          </span>
        </div>
        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {focusedRegion.cities.map((city) => cityName(city)).join("、")}
        </div>
      </div>

      {/* ── 地图容器 ── */}
      <svg
        aria-hidden="true"
        className="block w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      >
        <defs>
          <filter
            id="flat-map-halo"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {/* 经纬线 */}
        {createGraticuleLines().map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            x2={line.x2}
            y1={line.y1}
            y2={line.y2}
            stroke="var(--map-graticule)"
            strokeWidth="0.8"
          />
        ))}

        {/* 国家路径 */}
        {paths.length > 0 ? (
          paths.map((path) => {
            const isActive = path.region?.name === activeCountryName
            const isHighlighted = path.region?.id === highlightedRegionId

            return (
              <path
                key={path.id}
                className={path.isServiceRegion ? "map-region" : "map-country"}
                clipRule="evenodd"
                d={path.d}
                data-active={isActive ? "true" : undefined}
                data-hovered={isHighlighted ? "true" : undefined}
                fillRule="evenodd"
                onClick={() => {
                  if (!path.region) return
                  selectRegion(path.region)
                }}
                onPointerEnter={(e) => {
                  if (!path.region) return
                  setTooltipRegion(path.region)
                  onRegionFocus(path.region.id)
                  updateTooltipPosition(e.clientX, e.clientY)
                }}
                onPointerMove={(e) => {
                  if (!path.region) return
                  updateTooltipPosition(e.clientX, e.clientY)
                }}
                onPointerLeave={() => {
                  if (!path.region) return
                  setTooltipRegion(null)
                  onRegionFocus(null)
                }}
              />
            )
          })
        ) : (
          <FallbackContinents />
        )}

        {/* 服务区域光晕 */}
        {regions.map((region) => {
          const point = projectPoint(region.latitude, region.longitude)
          const isActive = region.name === activeCountryName
          const isHighlighted = region.id === highlightedRegionId
          return (
            <g key={`halo-${region.id}`}>
              <circle
                className="map-halo-glow"
                cx={point.x}
                cy={point.y}
                data-active={isActive ? "true" : undefined}
                data-focused={isHighlighted ? "true" : undefined}
                filter="url(#flat-map-halo)"
                r={region.isTiny ? 42 : 78}
              />
            </g>
          )
        })}

        {/* 重点服务城市标记 */}
        {locations.map((location) => {
          const point = projectPoint(location.latitude, location.longitude)
          const region = regionByCountryName.get(location.country)
          const isActive = location.id === activeLocation?.id
          const isHighlighted = region?.id === highlightedRegionId

          return (
            <g
              key={location.id}
              className="map-service-marker"
              data-active={isActive ? "true" : undefined}
              data-focused={isHighlighted ? "true" : undefined}
              onClick={() => onLocationChange(location.id)}
              onPointerEnter={(e) => {
                if (!region) return
                setTooltipRegion(region)
                onRegionFocus(region.id)
                updateTooltipPosition(e.clientX, e.clientY)
              }}
              onPointerMove={(e) => {
                if (!region) return
                updateTooltipPosition(e.clientX, e.clientY)
              }}
              onPointerLeave={() => {
                if (!region) return
                setTooltipRegion(null)
                onRegionFocus(null)
              }}
              transform={`translate(${point.x} ${point.y})`}
            >
              <circle
                className="map-service-marker-pulse"
                r={isActive ? 18 : 14}
              />
              <circle
                className="map-service-marker-ring"
                r={isActive ? 7 : 5.5}
              />
              <circle
                className="map-service-marker-dot"
                r={isActive ? 3.2 : 2.6}
              />
            </g>
          )
        })}
      </svg>

      {/* ── 国家 hover tooltip ── */}
      {tooltipRegion ? (
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-30 w-max max-w-[260px] rounded-xl border border-blue-500/30 bg-card px-3 py-2 text-xs shadow-xl shadow-blue-950/20 dark:bg-slate-950 dark:shadow-blue-950/60"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            <span className="font-semibold text-card-foreground">
              {regionName(tooltipRegion.name)}
            </span>
          </div>
          <div className="mt-1 pl-3.5 text-muted-foreground">
            {tooltipRegion.cities.map((city) => cityName(city)).join("、")}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Helper components & functions
   ══════════════════════════════════════════════════════ */

function FallbackContinents() {
  return (
    <g className="map-country">
      <ellipse cx={MAP_WIDTH * 0.18} cy={MAP_HEIGHT * 0.26} rx={150} ry={94} />
      <ellipse cx={MAP_WIDTH * 0.26} cy={MAP_HEIGHT * 0.44} rx={88} ry={116} />
      <ellipse cx={MAP_WIDTH * 0.54} cy={MAP_HEIGHT * 0.26} rx={98} ry={70} />
      <ellipse cx={MAP_WIDTH * 0.64} cy={MAP_HEIGHT * 0.36} rx={86} ry={128} />
      <ellipse cx={MAP_WIDTH * 0.74} cy={MAP_HEIGHT * 0.29} rx={185} ry={118} />
      <ellipse cx={MAP_WIDTH * 0.88} cy={MAP_HEIGHT * 0.51} rx={104} ry={66} />
    </g>
  )
}

function createGraticuleLines() {
  const lines: Array<{
    key: string
    x1: number
    x2: number
    y1: number
    y2: number
  }> = []

  for (let longitude = -150; longitude <= 180; longitude += 30) {
    const x = projectPoint(0, longitude).x
    lines.push({ key: `lon-${longitude}`, x1: x, x2: x, y1: 0, y2: MAP_HEIGHT })
  }

  for (let latitude = -40; latitude <= 80; latitude += 20) {
    const y = projectPoint(latitude, 0).y
    lines.push({ key: `lat-${latitude}`, x1: 0, x2: MAP_WIDTH, y1: y, y2: y })
  }

  return lines
}

function createFlatMapPaths(
  data: CountryFeatureCollection,
  serviceRegionIds: Set<string>,
  serviceRegionMap: Map<string, ServiceRegion>
): FlatMapPath[] {
  return (data.features ?? []).flatMap((feature, featureIndex) => {
    const geometry = feature.geometry
    const properties = feature.properties ?? {}
    const isoA3 = normalizeCountryId(properties.ISO_A3)
    const adm0A3 = normalizeCountryId(properties.ADM0_A3)
    const regionId = isoA3 === "-99" ? adm0A3 : isoA3
    const region =
      serviceRegionMap.get(regionId) ?? serviceRegionMap.get(adm0A3)
    const isServiceRegion =
      !!region || serviceRegionIds.has(regionId) || serviceRegionIds.has(adm0A3)

    if (!geometry?.coordinates) {
      return []
    }

    const polygons = getPolygonsFromGeometry(geometry)

    return polygons.flatMap((polygon, polygonIndex) => {
      if (!shouldRenderCountryPolygon(regionId, polygon)) {
        return []
      }

      const d = polygon
        .map((ring) => ringToPath(ring))
        .filter(Boolean)
        .join(" ")

      if (!d) {
        return []
      }

      return [
        {
          d,
          id: `${regionId || "country"}-${featureIndex}-${polygonIndex}`,
          isServiceRegion,
          region,
        },
      ]
    })
  })
}

function getPolygonsFromGeometry(geometry: {
  coordinates?: unknown
  type?: string
}) {
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    return [geometry.coordinates as number[][][]]
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates as number[][][][]
  }
  return []
}

function shouldRenderCountryPolygon(regionId: string, polygon: number[][][]) {
  if (regionId !== "FRA") {
    return true
  }

  const bounds = getPolygonBounds(polygon)

  if (!bounds) {
    return true
  }

  return (
    bounds.maxLon >= -10 &&
    bounds.minLon <= 12 &&
    bounds.maxLat >= 35 &&
    bounds.minLat <= 55
  )
}

function getPolygonBounds(polygon: number[][][]) {
  let minLon = Number.POSITIVE_INFINITY
  let maxLon = Number.NEGATIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  polygon.forEach((ring) => {
    ring.forEach(([longitude, latitude]) => {
      minLon = Math.min(minLon, longitude)
      maxLon = Math.max(maxLon, longitude)
      minLat = Math.min(minLat, latitude)
      maxLat = Math.max(maxLat, latitude)
    })
  })

  if (
    !Number.isFinite(minLon) ||
    !Number.isFinite(maxLon) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLat)
  ) {
    return null
  }

  return { maxLat, maxLon, minLat, minLon }
}

function ringToPath(ring: number[][]) {
  const step = ring.length > 300 ? 2 : 1
  const segments: string[] = []
  let currentSegment: string[] = []
  let previousLongitude: number | null = null

  function flushSegment() {
    if (currentSegment.length >= 3) {
      segments.push(currentSegment.join(" "))
    }
    currentSegment = []
  }

  ring.forEach((coordinate, index) => {
    const [longitude, latitude] = coordinate

    if (latitude <= LAT_MIN - LATITUDE_CUT_PADDING) {
      flushSegment()
      previousLongitude = null
      return
    }

    const shouldSample = index % step === 0 || index === ring.length - 1
    if (!shouldSample) {
      return
    }

    if (
      previousLongitude !== null &&
      Math.abs(longitude - previousLongitude) > DATELINE_SPLIT_DEGREES
    ) {
      flushSegment()
      previousLongitude = null
    }

    const point = projectPoint(latitude, longitude)
    const command = currentSegment.length === 0 ? "M" : "L"
    currentSegment.push(`${command}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    previousLongitude = longitude
  })

  flushSegment()

  return segments.join(" ")
}

function normalizeCountryId(value: string | number | null | undefined) {
  return String(value ?? "").toUpperCase()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function projectPoint(latitude: number, longitude: number) {
  const clampedLatitude = Math.max(LAT_MIN, Math.min(LAT_MAX, latitude))
  const wrappedLongitude =
    longitude < -180 || longitude > 180
      ? ((((longitude + 180) % 360) + 360) % 360) - 180
      : longitude
  const normalizedLongitude = (wrappedLongitude + 180) / 360

  return {
    x: normalizedLongitude * MAP_WIDTH,
    y: ((LAT_MAX - clampedLatitude) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT,
  }
}

function createLocationCountByCountry(locations: readonly ServiceLocation[]) {
  const countByCountry = new Map<string, number>()

  locations.forEach((location) => {
    countByCountry.set(
      location.country,
      (countByCountry.get(location.country) ?? 0) + 1
    )
  })

  return countByCountry
}

export { ServiceGlobe }
