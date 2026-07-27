import type { Icon } from "@phosphor-icons/react"

import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type IconCardProps = {
  icon: Icon
  title: string
  text: string
  className?: string
  iconClassName?: string
}

function IconCard({
  icon: IconComponent,
  title,
  text,
  className,
  iconClassName,
}: IconCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700",
          iconClassName
        )}
      >
        <IconComponent size={24} weight="fill" />
      </div>
      <CardTitle className="mt-5">{title}</CardTitle>
      <CardDescription className="mt-3">{text}</CardDescription>
    </Card>
  )
}

export { IconCard }
