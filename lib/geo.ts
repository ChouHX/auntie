import type { ServiceLocation } from "@/data/site"

export type GeoPoint = {
  latitude: number
  longitude: number
}

export type VisitorLocationSource = "ip" | "timezone" | "default"

export type VisitorLocation = GeoPoint & {
  city: string
  country: string
  source: VisitorLocationSource
}

type TimeZoneFallback = VisitorLocation & {
  pattern: RegExp
}

const DEFAULT_VISITOR_LOCATION: VisitorLocation = {
  city: "洛杉矶",
  country: "美国",
  latitude: 34.0522,
  longitude: -118.2437,
  source: "default",
}

const TIMEZONE_FALLBACKS: TimeZoneFallback[] = [
  {
    pattern: /^America\/(Los_Angeles|Tijuana|Vancouver)$/,
    city: "洛杉矶",
    country: "美国西海岸",
    latitude: 34.0522,
    longitude: -118.2437,
    source: "timezone",
  },
  {
    pattern: /^America\/(New_York|Toronto|Detroit|Boston)$/,
    city: "纽约",
    country: "美国东海岸",
    latitude: 40.7128,
    longitude: -74.006,
    source: "timezone",
  },
  {
    pattern: /^America\/Chicago$/,
    city: "芝加哥",
    country: "美国中部",
    latitude: 41.8781,
    longitude: -87.6298,
    source: "timezone",
  },
  {
    pattern: /^Europe\/London$/,
    city: "伦敦",
    country: "英国",
    latitude: 51.5072,
    longitude: -0.1276,
    source: "timezone",
  },
  {
    pattern: /^Europe\/Paris$/,
    city: "巴黎",
    country: "法国",
    latitude: 48.8566,
    longitude: 2.3522,
    source: "timezone",
  },
  {
    pattern: /^Asia\/(Singapore|Kuala_Lumpur)$/,
    city: "新加坡",
    country: "新加坡 / 马来西亚",
    latitude: 1.3521,
    longitude: 103.8198,
    source: "timezone",
  },
  {
    pattern: /^Asia\/(Shanghai|Hong_Kong|Macau|Taipei)$/,
    city: "上海",
    country: "中国及港澳台",
    latitude: 31.2304,
    longitude: 121.4737,
    source: "timezone",
  },
  {
    pattern: /^Asia\/Tokyo$/,
    city: "东京",
    country: "日本",
    latitude: 35.6764,
    longitude: 139.65,
    source: "timezone",
  },
  {
    pattern: /^Asia\/Seoul$/,
    city: "首尔",
    country: "韩国",
    latitude: 37.5665,
    longitude: 126.978,
    source: "timezone",
  },
  {
    pattern: /^Australia\/(Sydney|Melbourne|Brisbane)$/,
    city: "悉尼",
    country: "澳大利亚",
    latitude: -33.8688,
    longitude: 151.2093,
    source: "timezone",
  },
  {
    pattern: /^Pacific\/Auckland$/,
    city: "奥克兰",
    country: "新西兰",
    latitude: -36.8509,
    longitude: 174.7645,
    source: "timezone",
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readCoordinate(
  record: Record<string, unknown>,
  key: string
): number | null {
  const value = record[key]
  const coordinate =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN

  return Number.isFinite(coordinate) ? coordinate : null
}

function readText(
  record: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

async function fetchJson(url: string, timeoutMs = 3500): Promise<unknown> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Geo IP request failed: ${response.status}`)
    }

    return (await response.json()) as unknown
  } finally {
    clearTimeout(timeoutId)
  }
}

function parseIpLocation(payload: unknown): VisitorLocation | null {
  if (!isRecord(payload)) {
    return null
  }

  if (payload.success === false) {
    return null
  }

  const latitude = readCoordinate(payload, "latitude")
  const longitude = readCoordinate(payload, "longitude")

  if (latitude === null || longitude === null) {
    return null
  }

  return {
    city: readText(payload, ["city", "region"]) ?? "访客所在地",
    country:
      readText(payload, ["country_name", "country", "countryName"]) ??
      "当前国家 / 地区",
    latitude,
    longitude,
    source: "ip",
  }
}

async function resolveFromIp(): Promise<VisitorLocation | null> {
  if (typeof fetch !== "function") {
    return null
  }

  const endpoints = ["https://ipapi.co/json/", "https://ipwho.is/"]

  for (const endpoint of endpoints) {
    try {
      const location = parseIpLocation(await fetchJson(endpoint))

      if (location) {
        return location
      }
    } catch {
      // Continue to the next provider or fallback strategy.
    }
  }

  return null
}

function resolveFromTimeZone(): VisitorLocation | null {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  if (!timeZone) {
    return null
  }

  const fallback = TIMEZONE_FALLBACKS.find(({ pattern }) =>
    pattern.test(timeZone)
  )

  if (!fallback) {
    return null
  }

  return {
    city: fallback.city,
    country: fallback.country,
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    source: fallback.source,
  }
}

export async function resolveVisitorLocation(): Promise<VisitorLocation> {
  const ipLocation = await resolveFromIp()

  if (ipLocation) {
    return ipLocation
  }

  return resolveFromTimeZone() ?? DEFAULT_VISITOR_LOCATION
}

export function calculateDistanceKm(a: GeoPoint, b: GeoPoint) {
  const earthRadiusKm = 6371
  const latDelta = toRadians(b.latitude - a.latitude)
  const lonDelta = toRadians(b.longitude - a.longitude)
  const startLat = toRadians(a.latitude)
  const endLat = toRadians(b.latitude)
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  )
}

export function findNearestLocation(
  origin: GeoPoint,
  locations: readonly ServiceLocation[]
) {
  return locations.reduce<ServiceLocation | null>((nearest, location) => {
    if (!nearest) {
      return location
    }

    return calculateDistanceKm(origin, location) <
      calculateDistanceKm(origin, nearest)
      ? location
      : nearest
  }, null)
}

function toRadians(degree: number) {
  return (degree * Math.PI) / 180
}
