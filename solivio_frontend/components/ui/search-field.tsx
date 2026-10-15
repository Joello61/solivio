"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
  className?: string;
}

export function SearchField({
  value,
  onValueChange,
  label,
  placeholder,
  autoFocus,
  size = "md",
  className,
}: SearchFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-lg border border-input bg-card pr-12 pl-11 text-foreground outline-none",
          "placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
          size === "lg" ? "h-13 text-lg" : "h-11 text-base",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      )}
    </div>
  );
}
