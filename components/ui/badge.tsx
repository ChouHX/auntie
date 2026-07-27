import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import { badgeVariants } from "@/components/ui/badge-variants"
import { cn } from "@/lib/utils"

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge }
