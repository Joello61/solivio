import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden",
    "rounded-full border px-2.5 py-0.5",
    "text-xs font-semibold leading-none whitespace-nowrap",
    "transition-colors duration-150",
    "focus-visible:ring-2 focus-visible:ring-ring/50",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Primaire : fond teal plein */
        default:
          "bg-primary border-primary text-primary-foreground",

        /* Secondaire : teal pale */
        secondary:
          "bg-primary/10 border-primary/25 text-primary",

        /* Succes : identique secondaire (teal = succes dans ce contexte) */
        success:
          "bg-primary/10 border-primary/25 text-primary",

        /* Avertissement : coral/orange */
        warning:
          "bg-accent/10 border-accent/30 text-accent-strong",

        /* Accent : coral plein */
        accent:
          "bg-accent border-accent text-accent-foreground",

        /* Destructif : rouge pale */
        destructive:
          "bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20 dark:border-destructive/40",

        /* Outline : bordure seulement */
        outline:
          "bg-transparent border-border text-foreground",

        /* Muted : gris neutre */
        muted:
          "bg-muted border-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
