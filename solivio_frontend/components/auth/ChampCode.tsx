"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export const LONGUEUR_CODE = 6;

interface ChampCodeProps {
  /* Chiffres saisis, une case par chiffre ("" pour une case vide). */
  chiffres: string[];
  onChange: (chiffres: string[]) => void;
  libelle?: string;
}

export const CODE_VIDE: string[] = Array(LONGUEUR_CODE).fill("");

export function codeComplet(chiffres: string[]): boolean {
  return chiffres.join("").length === LONGUEUR_CODE;
}

/* Code a six chiffres recu par email : une case par chiffre, collage du code entier accepte. */
export function ChampCode({ chiffres, onChange, libelle = "Code de vérification" }: ChampCodeProps) {
  const cases = useRef<(HTMLInputElement | null)[]>([]);

  function saisir(index: number, valeur: string) {
    if (!/^\d?$/.test(valeur)) return;
    const suivants = [...chiffres];
    suivants[index] = valeur;
    onChange(suivants);
    if (valeur && index < LONGUEUR_CODE - 1) cases.current[index + 1]?.focus();
  }

  function reculer(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !chiffres[index] && index > 0) cases.current[index - 1]?.focus();
  }

  function coller(e: React.ClipboardEvent) {
    const colle = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LONGUEUR_CODE);
    if (colle.length === LONGUEUR_CODE) {
      onChange(colle.split(""));
      cases.current[LONGUEUR_CODE - 1]?.focus();
    }
    e.preventDefault();
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-base font-semibold text-foreground">{libelle}</legend>
      <div className="flex gap-2" onPaste={coller}>
        {chiffres.map((chiffre, i) => (
          <input
            key={i}
            ref={(el) => {
              cases.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={chiffre}
            onChange={(e) => saisir(i, e.target.value)}
            onKeyDown={(e) => reculer(i, e)}
            aria-label={`Chiffre ${i + 1}`}
            className={cn(
              "h-14 w-full min-w-0 max-w-13 rounded-lg border bg-card text-center font-mono text-2xl font-semibold tabular-nums text-foreground caret-transparent",
              "outline-none transition-colors duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
              chiffre ? "border-primary" : "border-input",
            )}
          />
        ))}
      </div>
    </fieldset>
  );
}
