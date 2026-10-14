"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/*
 * Toasts en negatif (encre sur papier inverse) : ils se detachent de la page dans
 * les deux modes. L'action (souvent "Annuler") prend le citron. La marge basse
 * mobile degage la barre de navigation.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={5000}
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "var(--foreground)",
          "--border-radius": "0.875rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !shadow-lg !text-base !gap-3 !px-4 !py-3.5",
          error: "!bg-destructive !text-destructive-foreground !border-destructive",
          actionButton:
            "!bg-accent !text-accent-foreground !font-semibold !text-sm !h-9 !px-3.5 !rounded-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
