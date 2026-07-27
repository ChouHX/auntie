import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FormFieldProps = React.ComponentProps<"div"> & {
  description?: React.ReactNode
  htmlFor?: string
  label: React.ReactNode
  required?: boolean
}

function FormField({
  children,
  className,
  description,
  htmlFor,
  label,
  required,
  ...props
}: FormFieldProps) {
  return (
    <div
      data-slot="form-field"
      className={cn("space-y-2", className)}
      {...props}
    >
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export { FormField }
