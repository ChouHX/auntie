import type { CmsServiceLocation, CmsServiceRegion } from "@/types/cms"

/**
 * 按 region.name（即 location.country）从 serviceLocations 聚合出每个国家下的城市中文名列表。
 *
 * 服务区域改造后，城市的唯一数据源是 `serviceLocations`（城市服务点），
 * `region.cities` 不再由后台维护，统一由本函数派生，避免双数据源改串。
 */
export function deriveCitiesByRegion(
  regions: readonly CmsServiceRegion[],
  locations: readonly CmsServiceLocation[]
): Map<string, string[]> {
  const map = new Map<string, string[]>()

  for (const region of regions) {
    map.set(region.name, [])
  }

  for (const location of locations) {
    const list = map.get(location.country)
    if (list && !list.includes(location.city)) {
      list.push(location.city)
    }
  }

  return map
}

/**
 * 返回带聚合 cities 的 region 视图，保留原 region 的其余字段。
 * 用于直接消费 `region.cities` 的旧代码路径，无需逐处改写。
 */
export function regionsWithDerivedCities(
  regions: readonly CmsServiceRegion[],
  locations: readonly CmsServiceLocation[]
): CmsServiceRegion[] {
  const citiesByRegion = deriveCitiesByRegion(regions, locations)
  return regions.map((region) => ({
    ...region,
    cities: citiesByRegion.get(region.name) ?? [],
  }))
}
