import { useEffect, useRef, useState } from "react"
import { SpinnerGap } from "@phosphor-icons/react"
import Globe, { type GlobeInstance } from "globe.gl"
import * as THREE from "three"

import type { ServiceLocation, ServiceRegion } from "@/data/site"
import { useI18n } from "@/lib/i18n"

type GlobeSceneProps = {
  activeLocation?: ServiceLocation
  activeRegion?: ServiceRegion
  locations: readonly ServiceLocation[]
  onLocationChange: (locationId: string) => void
  regions: readonly ServiceRegion[]
  onRegionChange: (regionId: string) => void
}

type CountryFeature = {
  id?: string
  properties?: Record<string, unknown>
}

type CountryFeatureCollection = {
  features: CountryFeature[]
}

type TooltipState = {
  description: string
  show: boolean
  title: string
  x: number
  y: number
}

type LocationMarker = ServiceLocation & {
  labelLatitude: number
  labelLongitude: number
}

function GlobeScene({
  activeLocation,
  activeRegion,
  locations,
  onLocationChange,
  regions,
  onRegionChange,
}: GlobeSceneProps) {
  const { cityName, dict, formatLocation, regionName } = useI18n()
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const globeRef = useRef<GlobeInstance | null>(null)
  const activeLocationRef = useRef(activeLocation)
  const activeRegionRef = useRef(activeRegion)
  const cityNameRef = useRef(cityName)
  const formatLocationRef = useRef(formatLocation)
  const onLocationChangeRef = useRef(onLocationChange)
  const onRegionChangeRef = useRef(onRegionChange)
  const regionNameRef = useRef(regionName)
  const pointerPositionRef = useRef({ x: 16, y: 16 })
  const [geoData, setGeoData] = useState<CountryFeatureCollection | null>(null)
  const [isFailed, setIsFailed] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>({
    description: "",
    show: false,
    title: "",
    x: 0,
    y: 0,
  })

  function updateTooltipPosition(clientX: number, clientY: number) {
    const scene = sceneRef.current

    if (!scene) {
      pointerPositionRef.current = { x: clientX, y: clientY }
      return pointerPositionRef.current
    }

    const rect = scene.getBoundingClientRect()
    const localX = clientX - rect.left
    const localY = clientY - rect.top
    const tooltipWidth = 280
    const tooltipHeight = 120
    const preferredX =
      localX + tooltipWidth + 22 > rect.width
        ? localX - tooltipWidth - 16
        : localX + 16
    const preferredY =
      localY + tooltipHeight + 22 > rect.height
        ? localY - tooltipHeight - 16
        : localY + 16

    pointerPositionRef.current = {
      x: clamp(preferredX, 12, Math.max(12, rect.width - tooltipWidth - 12)),
      y: clamp(preferredY, 12, Math.max(12, rect.height - tooltipHeight - 12)),
    }

    return pointerPositionRef.current
  }

  useEffect(() => {
    if (!tooltip.show) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      const position = updateTooltipPosition(event.clientX, event.clientY)

      setTooltip((current) => ({
        ...current,
        ...position,
      }))
    }

    window.addEventListener("pointermove", handlePointerMove)
    return () => window.removeEventListener("pointermove", handlePointerMove)
  }, [tooltip.show])

  useEffect(() => {
    activeLocationRef.current = activeLocation
  }, [activeLocation])

  useEffect(() => {
    activeRegionRef.current = activeRegion
  }, [activeRegion])

  useEffect(() => {
    cityNameRef.current = cityName
  }, [cityName])

  useEffect(() => {
    formatLocationRef.current = formatLocation
  }, [formatLocation])

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    onRegionChangeRef.current = onRegionChange
  }, [onRegionChange])

  useEffect(() => {
    regionNameRef.current = regionName
  }, [regionName])

  useEffect(() => {
    let isCancelled = false

    async function loadCountries() {
      try {
        const response = await fetch("/data/countries.geojson")

        if (!response.ok) {
          throw new Error(`Country data request failed: ${response.status}`)
        }

        const data = normalizeCountryFeatures(await response.json())

        if (!isCancelled) {
          setGeoData(data)
        }
      } catch {
        if (!isCancelled) {
          setIsFailed(true)
        }
      }
    }

    void loadCountries()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current

    if (!container || !geoData || globeRef.current) {
      return
    }

    const containerElement: HTMLDivElement = container
    const regionById = createRegionMap(regions)
    const locationMarkers = createLocationMarkers(locations)

    function showLocationTooltip(
      location: ServiceLocation,
      event?: PointerEvent
    ) {
      const position = event
        ? updateTooltipPosition(event.clientX, event.clientY)
        : pointerPositionRef.current

      setTooltip((current) => ({
        ...current,
        ...position,
        description: `${location.label} · ${regionNameRef.current(
          location.country
        )}`,
        show: true,
        title: formatLocationRef.current(location.city, location.country),
      }))
    }

    function createCityLabelElement(location: LocationMarker) {
      const element = document.createElement("button")

      element.type = "button"
      element.className = "globe-city-label"
      element.dataset.locationId = location.id
      element.dataset.active = String(
        location.id === activeLocationRef.current?.id
      )
      element.textContent = cityNameRef.current(location.city)
      element.title = formatLocationRef.current(location.city, location.country)

      element.addEventListener("pointerenter", (event) => {
        showLocationTooltip(location, event)
      })
      element.addEventListener("pointermove", (event) => {
        showLocationTooltip(location, event)
      })
      element.addEventListener("pointerleave", () => {
        setTooltip((current) => ({
          ...current,
          show: false,
        }))
      })
      element.addEventListener("click", (event) => {
        event.stopPropagation()
        onLocationChangeRef.current(location.id)
      })

      return element
    }

    const globe = new Globe(containerElement, {
      rendererConfig: {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        precision: "highp",
      },
    })
      .backgroundColor("#00000000")
      .showGlobe(true)
      .showAtmosphere(true)
      .atmosphereColor("#60a5fa")
      .atmosphereAltitude(0.14)
      .polygonsData(geoData.features)
      .polygonAltitude(0.004)
      .polygonCapColor((feature) =>
        getPolygonColor(feature, regionById, activeRegionRef.current)
      )
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((feature) => {
        const region = getFeatureRegion(feature, regionById)

        if (!region) {
          return "rgba(0,0,0,0)"
        }

        return region.id === activeRegionRef.current?.id
          ? "rgba(240,249,255,0.9)"
          : "rgba(191,219,254,0.12)"
      })
      .onPolygonHover((feature) => {
        const region = feature ? getFeatureRegion(feature, regionById) : null

        setTooltip((current) => ({
          ...current,
          ...pointerPositionRef.current,
          description: region
            ? region.cities.map((city) => cityName(city)).join("、")
            : "",
          show: Boolean(region),
          title: region ? regionName(region.name) : "",
        }))
      })
      .onPolygonClick((feature) => {
        const region = getFeatureRegion(feature, regionById)

        if (region) {
          onRegionChangeRef.current(region.id)
        }
      })
      .arcsData(locationMarkers)
      .arcStartLat((location) => (location as LocationMarker).latitude)
      .arcStartLng((location) => (location as LocationMarker).longitude)
      .arcEndLat((location) => (location as LocationMarker).labelLatitude)
      .arcEndLng((location) => (location as LocationMarker).labelLongitude)
      .arcStartAltitude(0.012)
      .arcEndAltitude((location) =>
        (location as LocationMarker).id === activeLocationRef.current?.id
          ? 0.09
          : 0.075
      )
      .arcAltitude(0.035)
      .arcCurveResolution(16)
      .arcCircularResolution(4)
      .arcStroke((location) =>
        (location as LocationMarker).id === activeLocationRef.current?.id
          ? 0.52
          : 0.28
      )
      .arcColor((location: object) =>
        (location as LocationMarker).id === activeLocationRef.current?.id
          ? ["rgba(125, 211, 252, 0.12)", "rgba(248, 250, 252, 0.92)"]
          : ["rgba(96, 165, 250, 0.06)", "rgba(125, 211, 252, 0.48)"]
      )
      .arcsTransitionDuration(420)
      .pointsData(locationMarkers)
      .pointLat((location) => (location as ServiceLocation).latitude)
      .pointLng((location) => (location as ServiceLocation).longitude)
      .pointAltitude((location) =>
        (location as ServiceLocation).id === activeLocationRef.current?.id
          ? 0.025
          : 0.016
      )
      .pointRadius((location) =>
        (location as ServiceLocation).id === activeLocationRef.current?.id
          ? 0.11
          : 0.07
      )
      .pointResolution(16)
      .pointColor((location) =>
        (location as ServiceLocation).id === activeLocationRef.current?.id
          ? "#f8fafc"
          : "rgba(125, 211, 252, 0.78)"
      )
      .onPointHover((point) => {
        const location = point as ServiceLocation | null

        setTooltip((current) => ({
          ...current,
          ...pointerPositionRef.current,
          description: location
            ? `${location.label} · ${regionName(location.country)}`
            : "",
          show: Boolean(location),
          title: location
            ? formatLocation(location.city, location.country)
            : "",
        }))
      })
      .onPointClick((point) => {
        const location = point as ServiceLocation | null

        if (location) {
          onLocationChangeRef.current(location.id)
        }
      })
      .htmlElementsData(locationMarkers)
      .htmlLat((location) => (location as LocationMarker).labelLatitude)
      .htmlLng((location) => (location as LocationMarker).labelLongitude)
      .htmlAltitude((location) =>
        (location as LocationMarker).id === activeLocationRef.current?.id
          ? 0.09
          : 0.075
      )
      .htmlElement((location) =>
        createCityLabelElement(location as LocationMarker)
      )
      .htmlTransitionDuration(420)
      .ringsData(activeLocationRef.current ? [activeLocationRef.current] : [])
      .ringLat((location) => (location as ServiceLocation).latitude)
      .ringLng((location) => (location as ServiceLocation).longitude)
      .ringAltitude(0.022)
      .ringColor(() => "rgba(125, 211, 252, 0.82)")
      .ringMaxRadius(1.05)
      .ringPropagationSpeed(1.45)
      .ringRepeatPeriod(1050)

    globeRef.current = globe

    try {
      const globeMaterial = globe.globeMaterial() as THREE.MeshPhongMaterial
      globeMaterial.color = new THREE.Color("#020617")
      globeMaterial.emissive = new THREE.Color("#0f172a")
      globeMaterial.specular = new THREE.Color("#1e3a8a")
      globeMaterial.shininess = 12
    } catch {
      // Globe material customization is best-effort.
    }

    const controls = globe.controls()
    controls.enableZoom = false
    controls.enablePan = false
    controls.autoRotate = false

    function resize() {
      globe.width(containerElement.clientWidth)
      globe.height(containerElement.clientHeight)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(containerElement)
    resize()

    window.setTimeout(() => {
      updateGlobeView(globe, activeRegionRef.current, activeLocationRef.current)
      updateCityLabelElements(containerElement, activeLocationRef.current)
    }, 100)

    return () => {
      resizeObserver.disconnect()
      globe._destructor()
      containerElement.innerHTML = ""
      globeRef.current = null
    }
  }, [cityName, formatLocation, geoData, locations, regionName, regions])

  useEffect(() => {
    updateGlobeView(globeRef.current, activeRegion, activeLocation)
    updateCityLabelElements(containerRef.current, activeLocation)
  }, [activeRegion, activeLocation])

  useEffect(() => {
    updateCityLabelElements(containerRef.current, activeLocation, {
      cityName,
      formatLocation,
      locations,
    })
  }, [activeLocation, cityName, formatLocation, locations])

  if (isFailed) {
    return (
      <div className="flex h-[340px] items-center justify-center border-y border-white/10 bg-slate-900 text-sm text-slate-300 sm:h-[460px] lg:h-[560px]">
        {dict.areas.failed}
      </div>
    )
  }

  if (!geoData) {
    return (
      <div className="flex h-[340px] flex-col items-center justify-center border-y border-white/10 bg-slate-900 text-slate-300 sm:h-[460px] lg:h-[560px]">
        <SpinnerGap className="mb-3 animate-spin text-blue-700" size={24} />
        <span className="text-sm tracking-[0.16em] uppercase">
          {dict.areas.loading}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={sceneRef}
      className="relative h-[340px] overflow-hidden border-y border-white/10 bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.34)_0%,rgba(15,23,42,0.92)_48%,#020617_100%)] sm:h-[460px] lg:h-[560px]"
      onPointerMoveCapture={(event) => {
        const position = updateTooltipPosition(event.clientX, event.clientY)

        if (tooltip.show) {
          setTooltip((current) => ({
            ...current,
            ...position,
          }))
        }
      }}
    >
      <div ref={containerRef} className="h-full w-full cursor-grab" />

      {tooltip.show ? (
        <div
          className="pointer-events-none absolute z-50 max-w-[280px] rounded-md border border-white/10 bg-slate-950/92 px-4 py-3 text-xs text-slate-300 shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="font-semibold text-white">{tooltip.title}：</span>
          <span className="leading-6 text-slate-300">
            {tooltip.description}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function normalizeCountryFeatures(payload: unknown): CountryFeatureCollection {
  if (!isRecord(payload) || !Array.isArray(payload.features)) {
    return { features: [] }
  }

  return {
    features: payload.features
      .filter(isRecord)
      .map((feature) => {
        const normalizedFeature = feature as CountryFeature
        normalizedFeature.id = getIsoA3(normalizedFeature)
        return normalizedFeature
      })
      .filter((feature) => Boolean(feature.id)),
  }
}

function getPolygonColor(
  feature: object,
  regionById: Map<string, ServiceRegion>,
  activeRegion?: ServiceRegion
) {
  const region = getFeatureRegion(feature, regionById)

  if (!region) {
    return "rgba(30,41,59,0.88)"
  }

  return region.id === activeRegion?.id ? "#38bdf8" : "#1e40af"
}

function getFeatureRegion(
  feature: object,
  regionById: Map<string, ServiceRegion>
) {
  const id = getObjectId(feature)

  return id ? regionById.get(id) : undefined
}

function createRegionMap(regions: readonly ServiceRegion[]) {
  return new Map(regions.map((region) => [region.id, region]))
}

function getObjectId(value: object) {
  const id = (value as { id?: unknown }).id

  return typeof id === "string" ? id : null
}

function getIsoA3(feature: CountryFeature) {
  const properties = feature.properties ?? {}
  const isoA3 = readString(properties, "ISO_A3")
  const fallbackIsoA3 = readString(properties, "ADM0_A3")

  if (isoA3 && isoA3 !== "-99") {
    return isoA3
  }

  if (fallbackIsoA3 && fallbackIsoA3 !== "-99") {
    return fallbackIsoA3
  }

  return typeof feature.id === "string" ? feature.id : undefined
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]

  return typeof value === "string" ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function createLocationMarkers(locations: readonly ServiceLocation[]) {
  return locations.map<LocationMarker>((location, index) => {
    const offset =
      CITY_LABEL_OFFSETS[location.id] ?? getDefaultLabelOffset(index)

    return {
      ...location,
      labelLatitude: clamp(location.latitude + offset.latitude, -72, 72),
      labelLongitude: normalizeLongitude(location.longitude + offset.longitude),
    }
  })
}

function getDefaultLabelOffset(index: number) {
  return DEFAULT_LABEL_OFFSETS[index % DEFAULT_LABEL_OFFSETS.length]
}

function normalizeLongitude(longitude: number) {
  if (longitude > 180) {
    return longitude - 360
  }

  if (longitude < -180) {
    return longitude + 360
  }

  return longitude
}

function updateCityLabelElements(
  container: HTMLElement | null,
  activeLocation?: ServiceLocation,
  options?: {
    cityName: (name: string) => string
    formatLocation: (city?: string, country?: string) => string
    locations: readonly ServiceLocation[]
  }
) {
  if (!container) {
    return
  }

  const locationById = options
    ? new Map(options.locations.map((location) => [location.id, location]))
    : null

  container
    .querySelectorAll<HTMLButtonElement>(".globe-city-label")
    .forEach((element) => {
      const locationId = element.dataset.locationId
      const location = locationId ? locationById?.get(locationId) : undefined

      element.dataset.active = String(locationId === activeLocation?.id)

      if (location && options) {
        element.textContent = options.cityName(location.city)
        element.title = options.formatLocation(location.city, location.country)
      }
    })
}

function updateGlobeView(
  globe: GlobeInstance | null,
  activeRegion?: ServiceRegion,
  activeLocation?: ServiceLocation
) {
  if (!globe || !activeRegion) {
    return
  }

  globe
    .polygonAltitude(0.004)
    .polygonCapColor((feature) =>
      getObjectId(feature) === activeRegion.id
        ? "#38bdf8"
        : isCoveredRegion(feature)
          ? "#1e40af"
          : "rgba(30,41,59,0.88)"
    )
    .polygonSideColor(() => "rgba(0,0,0,0)")
    .polygonStrokeColor((feature) =>
      getObjectId(feature) === activeRegion.id
        ? "rgba(240,249,255,0.9)"
        : isCoveredRegion(feature)
          ? "rgba(191,219,254,0.12)"
          : "rgba(0,0,0,0)"
    )
    .pointAltitude((location) =>
      (location as ServiceLocation).id === activeLocation?.id ? 0.025 : 0.016
    )
    .pointRadius((location) =>
      (location as ServiceLocation).id === activeLocation?.id ? 0.11 : 0.07
    )
    .pointColor((location) =>
      (location as ServiceLocation).id === activeLocation?.id
        ? "#f8fafc"
        : "rgba(125, 211, 252, 0.78)"
    )
    .arcEndAltitude((location) =>
      (location as ServiceLocation).id === activeLocation?.id ? 0.09 : 0.075
    )
    .arcStroke((location) =>
      (location as ServiceLocation).id === activeLocation?.id ? 0.52 : 0.28
    )
    .arcColor((location: object) =>
      (location as ServiceLocation).id === activeLocation?.id
        ? ["rgba(125, 211, 252, 0.12)", "rgba(248, 250, 252, 0.92)"]
        : ["rgba(96, 165, 250, 0.06)", "rgba(125, 211, 252, 0.48)"]
    )
    .htmlAltitude((location) =>
      (location as ServiceLocation).id === activeLocation?.id ? 0.09 : 0.075
    )
    .ringsData(activeLocation ? [activeLocation] : [])
    .ringColor(() => "rgba(125, 211, 252, 0.82)")
    .pointOfView(
      {
        altitude: 1.85,
        lat: activeLocation?.latitude ?? activeRegion.latitude,
        lng: activeLocation?.longitude ?? activeRegion.longitude,
      },
      1000
    )
}

function isCoveredRegion(feature: object) {
  const id = getObjectId(feature)

  return Boolean(id && COVERED_REGION_IDS.has(id))
}

const COVERED_REGION_IDS = new Set([
  "USA",
  "GBR",
  "FRA",
  "SGP",
  "CAN",
  "AUS",
  "NZL",
  "MYS",
  "JPN",
  "KOR",
])

const CITY_LABEL_OFFSETS: Record<
  string,
  { latitude: number; longitude: number }
> = {
  auckland: { latitude: -4.8, longitude: 7.2 },
  birmingham: { latitude: 3.4, longitude: -5.4 },
  boston: { latitude: 5.2, longitude: 6.4 },
  brisbane: { latitude: 5.4, longitude: 7.4 },
  chicago: { latitude: 4.5, longitude: -5.8 },
  detroit: { latitude: 4.4, longitude: 5.2 },
  irvine: { latitude: -5.4, longitude: -4.8 },
  "johor-bahru": { latitude: -3.8, longitude: 7.2 },
  "kuala-lumpur": { latitude: 3.5, longitude: -7.2 },
  london: { latitude: -2.8, longitude: -6.2 },
  "los-angeles": { latitude: -3.2, longitude: -8.2 },
  melbourne: { latitude: -4.4, longitude: 7.2 },
  "new-york": { latitude: 2.4, longitude: 7.2 },
  osaka: { latitude: -4.2, longitude: 7.4 },
  paris: { latitude: -4.2, longitude: 5.4 },
  penang: { latitude: 6.2, longitude: -6.6 },
  philadelphia: { latitude: -3.2, longitude: 6.5 },
  "san-francisco": { latitude: 5.2, longitude: -8.2 },
  "san-jose": { latitude: 1.4, longitude: -9.2 },
  seattle: { latitude: 4.4, longitude: -7.2 },
  seoul: { latitude: 4.7, longitude: -6.4 },
  singapore: { latitude: -4.6, longitude: 7.6 },
  sydney: { latitude: 1.8, longitude: 8.2 },
  tokyo: { latitude: 4.4, longitude: 7.4 },
  toronto: { latitude: 4.2, longitude: 7.2 },
  vancouver: { latitude: 4.2, longitude: -8.2 },
}

const DEFAULT_LABEL_OFFSETS = [
  { latitude: 4.6, longitude: 7.4 },
  { latitude: -4.4, longitude: 7.4 },
  { latitude: 4.4, longitude: -7.4 },
  { latitude: -4.4, longitude: -7.4 },
]

export { GlobeScene }
