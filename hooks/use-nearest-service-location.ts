import { useMemo, useState } from "react"

import type { ServiceLocation } from "@/data/site"

type LocationStatus = "locating" | "located" | "fallback"

function useNearestServiceLocation(locations: ServiceLocation[]) {
  const defaultLocation = locations[0]
  const [activeLocationId, setActiveLocationId] = useState(
    defaultLocation?.id ?? ""
  )

  const activeLocation = useMemo<ServiceLocation | undefined>(
    () =>
      locations.find((location) => location.id === activeLocationId) ??
      defaultLocation,
    [activeLocationId, locations, defaultLocation]
  )

  return {
    activeLocation,
    locations,
    setActiveLocationId,
    status: "fallback" as LocationStatus,
    visitorLocation: null,
  }
}

export { useNearestServiceLocation }
export type { LocationStatus }
