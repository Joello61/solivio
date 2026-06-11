import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  [
    "group/alert relative grid w-full gap-1 rounded-2xl border px-4 py-3.5 text-left text-sm",
    "has-data-[slot=alert-action]:pr-16",
    "has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3",
    "*:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current",
    "*:[svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-teal-50 border-teal-200 text-teal-900 *:[svg]:text-teal-600 dark:bg-teal-950/30 dark:border-teal-800/50 dark:text-teal-100",
        info:
          "bg-blue-50 border-blue-200 text-blue-900 *:[svg]:text-blue-600 dark:bg-blue-950/30 dark:border-blue-800/50",
        warning:
          "bg-coral-50 border-coral-200 text-coral-900 *:[svg]:text-coral-600 dark:bg-coral-950/30 dark:border-coral-800/50",
        destructive:
          "bg-red-50 border-red-200 text-destructive *:[svg]:text-destructive dark:bg-red-950/30 dark:border-red-800/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-semibold leading-snug group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
