import * as React from "react"

import { cn } from "@/lib/utils"

/* Variants de card : a plat par defaut (bordure seule). "elevated" pour ce qui
   doit se detacher, "tinted" pour un encart bleu pale. */
type CardVariant = "default" | "elevated" | "flat" | "tinted"
type CardSize = "default" | "sm" | "lg"

interface CardProps extends React.ComponentProps<"div"> {
  variant?: CardVariant
  size?: CardSize
}

const variantClasses: Record<CardVariant, string> = {
  default:  "bg-card",
  elevated: "bg-card shadow-sm",
  flat:     "bg-card",
  tinted:   "bg-secondary border-transparent",
}

const sizeClasses: Record<CardSize, string> = {
  sm:      "rounded-lg",
  default: "rounded-xl",
  lg:      "rounded-xl",
}

function Card({ className, variant = "default", size = "default", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-0 overflow-hidden",
        "border border-border text-card-foreground",
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
        "flex flex-col gap-1 px-5 pt-5 pb-0 sm:px-6 sm:pt-6",
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
        "font-display text-lg font-bold leading-snug",
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
      className={cn("text-base text-muted-foreground leading-snug", className)}
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
        "px-5 py-5 sm:px-6 sm:py-6",
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
        "flex items-center border-t border-border px-5 py-4 sm:px-6",
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
