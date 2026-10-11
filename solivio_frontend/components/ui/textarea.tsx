import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-sm",
        "text-foreground placeholder:text-muted-foreground/60 leading-relaxed",
        "transition-all duration-150 outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
