import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Tailles : "default" (44 px) est la cible tactile confortable, utilisee partout
 * sur mobile ; "sm" sert aux tableaux denses sur ordinateur ; "xl" (56 px) au
 * mode jour J.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-lg border border-transparent font-semibold whitespace-nowrap",
    "leading-none select-none",
    "transition-colors duration-150 ease-out",
    "outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125rem]",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Action principale : une seule par ecran */
        default: "bg-primary text-primary-foreground hover:bg-primary/90",

        /* Action d'appoint mise en avant : pin pale */
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",

        /* Action courante : bordure lisible sur papier comme sur carte */
        outline: "bg-card text-foreground border-input hover:bg-muted",

        /* Action discrete, barres d'outils */
        ghost: "bg-transparent text-foreground hover:bg-muted",

        /* Citron : ce qui se passe maintenant (ouvrir le jour J) */
        accent: "bg-accent text-accent-foreground hover:bg-accent/85",

        /* Destruction proposee : discrete, jamais au premier plan */
        destructive: [
          "bg-transparent text-destructive border-destructive/40",
          "hover:bg-destructive/10 focus-visible:ring-destructive/30",
        ].join(" "),

        /* Destruction confirmee, dans une boite de dialogue uniquement */
        "destructive-solid": [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 focus-visible:ring-destructive/30",
        ].join(" "),

        link: "h-auto px-0 text-primary underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        xs: "h-8 px-2.5 text-sm rounded-md gap-1.5 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-9 px-3 text-sm gap-1.5 [&_svg:not([class*='size-'])]:size-4",
        default: "h-11 px-4 text-base",
        lg: "h-12 px-5 text-base",
        xl: "h-14 px-6 text-lg rounded-xl",
        icon: "size-11",
        "icon-xs": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
