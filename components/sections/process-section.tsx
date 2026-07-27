import {
  ArrowRight,
  CalendarCheck,
  ChatCircleText,
  CheckCircle,
  Clock,
  HouseLine,
  PhoneCall,
} from "@phosphor-icons/react"
import { Link } from "@/lib/router-compat"

import { Section, SectionHeading } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const processIcons = [
  ChatCircleText,
  CalendarCheck,
  Clock,
  PhoneCall,
  HouseLine,
  CheckCircle,
]

type ProcessSectionProps = {
  className?: string
}

function ProcessSection({ className }: ProcessSectionProps) {
  const { dict } = useI18n()
  const bookingSteps = dict.processSection.steps

  return (
    <Section id="process" className={cn("py-10 sm:py-18", className)}>
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          kicker={dict.processSection.kicker}
          title={dict.processSection.title}
          description={dict.processSection.description}
          className="max-w-3xl"
        />
        <Button
          asChild
          className="h-9 w-fit px-4 text-sm sm:h-10 sm:px-6"
          variant="brandDark"
        >
          <Link to="/booking">{dict.common.bookNow}</Link>
        </Button>
      </div>

      <div className="relative mt-6 sm:mt-10">
        <div className="absolute top-[4.85rem] right-[7%] left-[7%] hidden h-px overflow-hidden bg-border lg:block dark:bg-white/10">
          <div className="animate-flow-line h-full w-1/3 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {bookingSteps.map((step, index) => {
            const IconComponent = processIcons[index] ?? CheckCircle
            const isLast = index === bookingSteps.length - 1

            return (
              <Card
                key={step.title}
                className="group animate-fade-up relative rounded-md bg-card/88 p-3 shadow-none transition duration-300 hover:shadow-lg hover:shadow-blue-100/50 sm:p-5 dark:bg-white/[0.06] dark:hover:shadow-blue-950/30"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-blue-700 text-white shadow-sm sm:size-12 dark:bg-blue-600">
                      <IconComponent
                        className="size-5 sm:size-6"
                        weight="fill"
                      />
                    </div>
                    <span className="text-xs font-semibold tracking-[0.18em] text-blue-700 dark:text-blue-200">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm leading-snug font-semibold text-slate-950 sm:mt-5 sm:min-h-12 sm:text-base dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600 sm:mt-3 sm:line-clamp-none sm:leading-6 dark:text-slate-300">
                    {step.text}
                  </p>
                </div>

                {!isLast ? (
                  <div
                    className={cn(
                      "absolute top-[4.05rem] -right-3 z-20 hidden size-7 items-center justify-center rounded-full border border-border bg-card text-blue-700 shadow-sm lg:flex dark:border-white/10 dark:bg-slate-900 dark:text-blue-200"
                    )}
                  >
                    <ArrowRight size={15} weight="bold" />
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export { ProcessSection }
