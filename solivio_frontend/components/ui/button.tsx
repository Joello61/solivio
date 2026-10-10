import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  /* Base : layout + typographie + transitions */
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-lg border border-transparent font-medium whitespace-nowrap",
    "text-sm leading-none select-none",
    "transition-all duration-150 ease-out",
    "outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "active:not-aria-[haspopup]:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Primaire : fond teal plein, shadow coloree au hover */
        default: [
          "bg-primary text-primary-foreground border-primary",
          "hover:bg-primary/90 hover:border-primary",
          "hover:shadow-primary",
          "active:bg-primary/90",
        ].join(" "),

        /* Secondaire : fond teal tres pale, texte teal */
        secondary: [
          "bg-primary/10 text-primary border-primary/20",
          "hover:bg-primary/15 hover:border-primary/25",
        ].join(" "),

        /* Outline : bordure visible, fond transparent */
        outline: [
          "bg-transparent text-foreground border-border",
          "hover:bg-muted hover:border-border",
          "",
        ].join(" "),

        /* Ghost : sans bordure ni fond, discret */
        ghost: [
          "bg-transparent text-muted-foreground border-transparent",
          "hover:bg-muted hover:text-foreground",
        ].join(" "),

        /* Accent : coral/orange pour CTAs secondaires importants */
        accent: [
          "bg-accent text-accent-foreground border-accent",
          "hover:bg-accent hover:border-accent",
          "hover:shadow-accent",
        ].join(" "),

        /* Destructif : rouge discret en fond, plus visible au hover */
        destructive: [
          "bg-destructive/10 text-destructive border-destructive/20",
          "hover:bg-destructive/20 hover:border-destructive/40",
          "focus-visible:ring-destructive/30",
        ].join(" "),

        /* Link : texte seul avec underline au hover */
        link: "text-primary underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 px-3 text-sm rounded-lg gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-base rounded-xl",
        xl: "h-12 px-6 text-base rounded-xl font-semibold",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-5",
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
