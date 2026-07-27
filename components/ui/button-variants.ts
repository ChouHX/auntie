import { cva } from "class-variance-authority"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        brand:
          "rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/85 dark:shadow-none",
        brandStrong:
          "rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/85 dark:shadow-none",
        brandDark:
          "rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/85 dark:shadow-none",
        brandOutline:
          "rounded-full border-primary/25 bg-background/50 text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5 dark:bg-white/[0.04] dark:hover:bg-white/[0.12]",
        heroPrimary:
          "rounded-full border-primary bg-primary text-primary-foreground shadow-none hover:bg-primary/85",
        heroSecondary:
          "rounded-full border-white/38 bg-white/12 text-white shadow-none hover:border-white/55 hover:bg-white/18",
        navIcon:
          "rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
        navMenu:
          "rounded-xl border-border bg-card text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-white/25 dark:hover:bg-white/[0.1] dark:hover:text-white",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1.5 px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export { buttonVariants }
