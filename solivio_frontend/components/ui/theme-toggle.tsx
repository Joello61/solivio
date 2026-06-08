"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  /** compact = icone seule, label = icone + texte */
  variant?: "compact" | "label";
}

export function ThemeToggle({ className, variant = "compact" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (variant === "label") {
    return (
      <button
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors",
          className,
        )}
        aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      >
        {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
        <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
        className,
      )}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
