"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { rechercherCatalogueDenrees, creerCatalogueDenree } from "@/lib/api/distributions";
import type { CatalogueDenreeResponse } from "@/types/distribution";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function CreatableCombobox({ value: valueProp, onChange, placeholder, id }: Props) {
  const value = valueProp ?? "";
  const [suggestions, setSuggestions] = useState<CatalogueDenreeResponse[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function fetchSuggestions(q: string) {
    if (q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      const resultats = await rechercherCatalogueDenrees(q);
      setSuggestions(resultats);
    } catch {
      setSuggestions([]);
    }
  }

  function handleInputChange(newValue: string) {
    onChange(newValue);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(newValue), 300);
  }

  async function handleFocus() {
    setOpen(true);
    if (value.trim().length > 0) {
      await fetchSuggestions(value);
    }
  }

  async function ajouter() {
    const libelle = value.trim();
    if (!libelle) return;
    try {
      // tente une creation immediate ; echoue silencieusement si role insuffisant (coordinateur)
      // dans ce cas l'entree sera creee automatiquement par enregistrerSiInconnu lors du submit
      await creerCatalogueDenree(libelle);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function selectionner(libelle: string) {
    onChange(libelle);
    setSuggestions([]);
    setOpen(false);
  }

  const exactMatch = suggestions.some(
    (s) => s.libelle.toLowerCase() === value.toLowerCase(),
  );
  const showAjouter = value.trim().length > 0 && !exactMatch;
  const showDropdown = open && (suggestions.length > 0 || showAjouter);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onFocus={handleFocus}
        onChange={(e) => handleInputChange(e.target.value)}
        autoComplete="off"
      />

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border/60 bg-white dark:bg-neutral-900 shadow-md overflow-hidden">
          {suggestions.map((s) => {
            const isSelected = s.libelle.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectionner(s.libelle)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
              >
                {isSelected ? (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
                {s.libelle}
              </button>
            );
          })}

          {showAjouter && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={ajouter}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 border-t border-border"
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Ajouter <span className="font-medium">&quot;{value}&quot;</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
