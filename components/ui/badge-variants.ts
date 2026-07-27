import { cva } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-secondary-foreground dark:bg-white/[0.08] dark:text-slate-200",
        secondary:
          "border-border bg-card text-secondary-foreground shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-none",
        glass: "border-white/15 bg-white/10 text-white/80 backdrop-blur",
        amber:
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export { badgeVariants }
