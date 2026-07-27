import { useMemo, useState } from "react"

import { serviceLocations } from "@/data/site"
import type { ServiceLocation } from "@/data/site"

type LocationStatus = "locating" | "located" | "fallback"

const defaultLocation = serviceLocations[0]

function useNearestServiceLocation() {
  const [activeLocationId, setActiveLocationId] = useState(
    defaultLocation?.id ?? ""
  )

  const activeLocation = useMemo<ServiceLocation | undefined>(
    () =>
      serviceLocations.find((location) => location.id === activeLocationId) ??
      defaultLocation,
    [activeLocationId]
  )

  return {
    activeLocation,
    locations: serviceLocations,
    setActiveLocationId,
    status: "fallback" as LocationStatus,
    visitorLocation: null,
  }
}

export { useNearestServiceLocation }
export type { LocationStatus }
