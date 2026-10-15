import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Pastilles de statut. Le plus important se voit le plus : "accent" (jaune) pour
 * ce qui se passe maintenant, "muted" pour ce qui est passe. Jamais la couleur
 * seule : le libelle porte toujours l'information.
 */
const badgeVariants = cva(
  [
    "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden",
    "rounded-full border border-transparent px-2.5",
    "text-xs font-semibold leading-none whitespace-nowrap",
    "focus-visible:ring-2 focus-visible:ring-ring/50",
    "[&>svg]:pointer-events-none [&>svg]:size-3.5",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-success/12 text-success",
        warning: "bg-warning/12 text-warning",
        info: "bg-info/12 text-info",
        accent: "bg-accent text-accent-foreground",
        destructive: "bg-destructive/12 text-destructive",
        outline: "border-border text-foreground",
        /* Brouillon : pas encore reel */
        dashed: "border-dashed border-muted-foreground/60 text-foreground",
        muted: "bg-muted text-muted-foreground",
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
