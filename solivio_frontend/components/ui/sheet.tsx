"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/*
 * Feuille : panneau qui monte du bas sur telephone (atteignable au pouce) et
 * glisse depuis la droite sur ordinateur. Sert aux formulaires courts et aux
 * fiches de detail sans quitter la page.
 */
const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

function SheetContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-5 overflow-y-auto overscroll-contain bg-card text-card-foreground shadow-xl outline-none",
          "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          "sm:inset-x-auto sm:top-0 sm:right-0 sm:h-dvh sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:border-t-0 sm:border-l sm:p-6",
          "duration-200 data-open:animate-in data-open:slide-in-from-bottom sm:data-open:slide-in-from-right data-closed:animate-out data-closed:fade-out-0",
          className
        )}
        {...props}
      >
        <div aria-hidden="true" className="mx-auto -mt-2 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        {children}
        <DialogPrimitive.Close
          render={<Button variant="ghost" size="icon" className="absolute top-3 right-3" />}
        >
          <XIcon />
          <span className="sr-only">Fermer</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 pr-10", className)} {...props} />
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("font-display text-2xl leading-tight font-bold", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-base leading-snug text-muted-foreground", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter }
