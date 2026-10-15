"use client";

import { cn } from "@/lib/utils";

export interface OptionSegment<T extends string> {
  value: T;
  label: string;
  /* Nombre d'elements, affiche apres le libelle. */
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: OptionSegment<T>[];
  /* Nom du filtre pour les lecteurs d'ecran. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}

/*
 * Filtre a choix unique. Visuellement distinct d'une pastille de statut : un
 * filtre se choisit, un statut se lit.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex w-fit max-w-full flex-wrap gap-1 rounded-xl bg-muted p-1",
        className,
      )}
    >
      {options.map((option) => {
        const actif = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={actif}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 whitespace-nowrap",
              size === "md" ? "h-10 text-base" : "h-8 text-sm",
              actif
                ? "bg-card font-semibold text-foreground shadow-xs"
                : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("tabular-nums", actif ? "text-muted-foreground" : "")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
