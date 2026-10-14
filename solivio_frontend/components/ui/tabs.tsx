"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  [
    "group/tabs-list inline-flex w-fit items-center justify-center p-1",
    "text-muted-foreground",
    "group-data-horizontal/tabs:h-auto group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
    "data-[variant=line]:rounded-none data-[variant=line]:p-0 data-[variant=line]:border-b data-[variant=line]:border-border",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-muted rounded-xl",
        line: "gap-6 bg-transparent rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-lg",
        "min-h-10 px-3.5 py-2 text-base font-medium whitespace-nowrap",
        "text-muted-foreground border border-transparent",
        "transition-all duration-150 outline-none",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:opacity-45",
        /* Variante default : fond blanc + shadow sur l'item actif */
        "group-data-[variant=default]/tabs-list:data-active:bg-card",
        "group-data-[variant=default]/tabs-list:data-active:text-foreground",
        "group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        "group-data-[variant=default]/tabs-list:data-active:font-semibold",
        /* Variante line : indicateur en bas */
        "group-data-[variant=line]/tabs-list:rounded-none",
        "group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:min-h-11",
        "group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:font-semibold",
        "after:absolute after:transition-all after:duration-200",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:inset-x-0",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:bottom-[-1px]",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:h-[3px]",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:bg-primary",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:rounded-full",
        "group-data-[variant=line]/tabs-list:after:opacity-0",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-base outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
