"use client"

import Link from "next/link"
import { Menu } from "@base-ui/react/menu"
import type { LucideIcon } from "lucide-react"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export interface ActionMenuItem {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  href?: string
  /* Action destructrice : rangee en bas, separee, en rouge. */
  destructive?: boolean
  disabled?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  /* Nom accessible du bouton, par exemple "Plus d'actions sur la distribution". */
  label?: string
  size?: "sm" | "default"
  className?: string
}

const classeItem = cn(
  "flex min-h-11 cursor-default items-center gap-3 rounded-md px-3 text-base outline-none select-none",
  "data-highlighted:bg-muted data-disabled:opacity-50",
)

/*
 * Menu "Plus" : les actions rares et destructrices, pour qu'un ecran n'affiche
 * qu'une action principale.
 */
export function ActionMenu({ items, label = "Plus d'actions", size = "default", className }: ActionMenuProps) {
  const courantes = items.filter((i) => !i.destructive)
  const destructrices = items.filter((i) => i.destructive)

  function rendre(item: ActionMenuItem) {
    const Icone = item.icon
    const contenu = (
      <>
        {Icone && <Icone aria-hidden="true" className="size-5 shrink-0" />}
        {item.label}
      </>
    )
    const classes = cn(classeItem, item.destructive && "text-destructive")
    if (item.href) {
      return (
        <Menu.LinkItem key={item.label} className={classes} render={<Link href={item.href} />}>
          {contenu}
        </Menu.LinkItem>
      )
    }
    return (
      <Menu.Item key={item.label} className={classes} onClick={item.onClick} disabled={item.disabled}>
        {contenu}
      </Menu.Item>
    )
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={label}
        className={cn(buttonVariants({ variant: "outline", size: size === "sm" ? "icon-sm" : "icon" }), className)}
      >
        <MoreHorizontal aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50 outline-none" sideOffset={6} align="end">
          <Menu.Popup className="min-w-56 origin-(--transform-origin) rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none data-ending-style:opacity-0 data-starting-style:opacity-0">
            {courantes.map(rendre)}
            {courantes.length > 0 && destructrices.length > 0 && (
              <Menu.Separator className="mx-1 my-1 h-px bg-border" />
            )}
            {destructrices.map(rendre)}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
