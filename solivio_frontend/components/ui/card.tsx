import * as React from "react"

import { cn } from "@/lib/utils"

/* Variants de card :
   - default : card standard avec shadow sm
   - elevated : card avec shadow md + hover shadow lg
   - flat : card sans shadow, bordure seulement
   - tinted : fond tinte par la couleur primaire */
type CardVariant = "default" | "elevated" | "flat" | "tinted"
type CardSize = "default" | "sm" | "lg"

interface CardProps extends React.ComponentProps<"div"> {
  variant?: CardVariant
  size?: CardSize
}

const variantClasses: Record<CardVariant, string> = {
  default:  "bg-card shadow-sm hover:shadow-md",
  elevated: "bg-card shadow-md hover:shadow-lg",
  flat:     "bg-card border-border/60",
  tinted:   "bg-primary/10 border-primary/20",
}

const sizeClasses: Record<CardSize, string> = {
  sm:      "rounded-xl",
  default: "rounded-2xl",
  lg:      "rounded-2xl",
}

function Card({ className, variant = "default", size = "default", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-0 overflow-hidden",
        "border border-border/60 text-card-foreground",
        "transition-shadow duration-200",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 px-6 pt-6 pb-0",
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:pt-4",
        "group-data-[size=lg]/card:px-8 group-data-[size=lg]/card:pt-8",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-display text-lg font-semibold leading-snug tracking-tight",
        "group-data-[size=sm]/card:text-base",
        "group-data-[size=lg]/card:text-xl",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto shrink-0", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-6 py-6",
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-4",
        "group-data-[size=lg]/card:px-8 group-data-[size=lg]/card:py-8",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-border/60 bg-muted/40 px-6 py-4",
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-3",
        "group-data-[size=lg]/card:px-8 group-data-[size=lg]/card:py-5",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
