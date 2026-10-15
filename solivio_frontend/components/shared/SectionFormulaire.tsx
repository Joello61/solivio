import type { ReactNode } from "react";

/* Section d'un formulaire en une colonne : un titre, ses champs. */
export function SectionFormulaire({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <legend className="float-left mb-1 w-full font-display text-xl font-bold text-foreground">{titre}</legend>
      {children}
    </fieldset>
  );
}
