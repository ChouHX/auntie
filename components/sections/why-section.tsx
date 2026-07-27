import { CaretRight, X } from "@phosphor-icons/react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { highlights } from "@/data/site"
import { useI18n } from "@/lib/i18n"

function WhySection() {
  const { dict } = useI18n()

  return (
    <section
      id="why"
      className="relative z-0 overflow-hidden py-10 text-slate-950 sm:py-20 dark:text-white"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
            {dict.why.kicker}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-balance sm:mt-3 sm:text-4xl">
            {dict.why.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7 dark:text-slate-200/80">
            {dict.why.description}
          </p>
        </div>

        {/* ── Mobile: compact 2-col icon+title, tap to expand ── */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:hidden">
          {highlights.map(({ icon: IconComponent }, index) => {
            const item = dict.why.items[index]
            if (!item) return null
            return (
              <MobileWhyCard
                key={item.title}
                icon={<IconComponent className="size-7" weight="duotone" />}
                dialogIcon={
                  <IconComponent className="size-11" weight="duotone" />
                }
                title={item.title}
                text={item.text}
                index={index}
              />
            )
          })}
        </div>

        {/* ── Desktop: full cards ── */}
        <div className="mt-10 hidden grid-cols-3 gap-5 sm:grid lg:gap-7">
          {highlights.map(({ icon: IconComponent }, index) => {
            const item = dict.why.items[index]
            if (!item) return null

            return (
              <article
                key={item.title}
                className="animate-fade-up rounded-xl border border-blue-100/70 bg-white/58 p-5 text-left shadow-sm shadow-blue-100/30 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-none"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="why-icon-enter flex size-16 items-center justify-center text-blue-700 dark:text-blue-200">
                  <IconComponent className="size-14" weight="duotone" />
                </div>
                <h3 className="mt-4 text-lg leading-snug font-semibold text-slate-950 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-4 text-sm leading-7 text-slate-600 dark:text-slate-200/75">
                  {item.text}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

type MobileWhyCardProps = {
  dialogIcon: React.ReactNode
  icon: React.ReactNode
  title: string
  text: string
  index: number
}

function MobileWhyCard({
  dialogIcon,
  icon,
  title,
  text,
  index,
}: MobileWhyCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="animate-fade-up flex h-full min-h-[78px] flex-col justify-between rounded-xl border border-blue-100/70 bg-white/70 p-2.5 text-left shadow-sm shadow-blue-100/30 transition hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:shadow-none dark:hover:bg-white/[0.08]"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center text-blue-700 dark:text-blue-200">
              {icon}
            </div>
            <h3 className="flex-1 text-xs leading-snug font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          </div>
          <div className="mt-2 flex justify-end text-blue-700 dark:text-blue-200">
            <CaretRight size={15} weight="bold" />
          </div>
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1.5rem)] max-w-sm gap-0 overflow-hidden rounded-xl border-blue-100/80 bg-card p-0 shadow-2xl sm:hidden dark:border-white/10 dark:bg-slate-950"
      >
        <DialogClose className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 focus:ring-2 focus:ring-ring focus:outline-none dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
          <X size={15} weight="bold" />
          <span className="sr-only">关闭</span>
        </DialogClose>

        <div className="p-5">
          <DialogHeader className="pr-8">
            <div className="mb-3 flex size-14 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
              {dialogIcon}
            </div>
            <DialogTitle className="text-xl leading-snug text-slate-950 dark:text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {text}
            </DialogDescription>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { WhySection }
