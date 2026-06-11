import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        /* Dimensions et forme */
        "h-10 w-full min-w-0 rounded-xl border border-input bg-white px-4 py-2",
        /* Typographie */
        "text-sm text-foreground placeholder:text-muted-foreground/60",
        /* Transitions */
        "transition-all duration-150 outline-none",
        /* Focus : ring teal + bordure teal */
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
        "focus-visible:shadow-[0_0_0_1px_oklch(0.532_0.118_185_/_0.15)]",
        /* Etats speciaux */
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        /* Fichier */
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        /* Dark mode */
        "dark:bg-neutral-900 dark:border-neutral-700 dark:focus-visible:border-ring",
        "dark:disabled:bg-neutral-800",
        className
      )}
      {...props}
    />
  )
}

export { Input }
