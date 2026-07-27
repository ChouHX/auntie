import { serviceRegions } from "@/data/site"
import { CountUp } from "@/components/common/count-up"
import { Section } from "@/components/common/section"
import { ServiceGlobe } from "@/components/common/service-globe"
import { useNearestServiceLocation } from "@/hooks/use-nearest-service-location"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type AreasSectionProps = {
  id?: string
  variant?: "home" | "page"
}

function AreasSection({ id = "areas", variant = "home" }: AreasSectionProps) {
  const { dict } = useI18n()
  const { activeLocation, locations, setActiveLocationId } =
    useNearestServiceLocation()
  const cityCount = serviceRegions.reduce(
    (total, region) => total + region.cities.length,
    0
  )

  return (
    <Section
      id={id}
      className={cn(
        "overflow-hidden transition-colors duration-300",
        variant === "page" ? "pt-24 sm:pt-32" : "py-10 sm:py-20"
      )}
    >
      <div className="relative">
        <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="animate-fade-up max-w-3xl">
            <div className="text-xs font-semibold tracking-[0.18em] text-blue-600 uppercase dark:text-blue-400">
              {dict.areas.kicker}
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-balance text-foreground sm:mt-3 sm:text-4xl">
              {dict.areas.title}
            </h2>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-blue-950/10 backdrop-blur sm:rounded-2xl sm:shadow-xl lg:min-w-[430px] dark:bg-slate-800/80 dark:shadow-blue-950/40">
            <CoverageStat
              label={dict.areas.countries}
              value={serviceRegions.length}
            />
            <CoverageStat
              label={dict.areas.cities}
              suffix="+"
              value={cityCount}
            />
            <CoverageStat
              label={dict.areas.servicePoints}
              suffix="+"
              value={100}
            />
          </div>
        </div>

        <ServiceGlobe
          activeLocation={activeLocation}
          locations={locations}
          onLocationChange={setActiveLocationId}
        />
      </div>
    </Section>
  )
}

type CoverageStatProps = {
  label: string
  suffix?: string
  value: number
}

function CoverageStat({ label, suffix = "", value }: CoverageStatProps) {
  return (
    <div className="border-r border-border p-2.5 text-center last:border-r-0 sm:p-4">
      <div className="text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
        <CountUp to={value} duration={1.8} separator="," />
        {suffix}
      </div>
      <div className="mt-0.5 text-[10px] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">
        {label}
      </div>
    </div>
  )
}

export { AreasSection }
