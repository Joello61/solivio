import type { Metadata } from "next";
import { FormulaireMissionCollecte } from "@/components/collecte/FormulaireMissionCollecte";

export const metadata: Metadata = { title: "Nouvelle mission collecte" };

export default function NouvelleMissionCollectePage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Nouvelle mission</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Definissez les details de la mission de collecte.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6">
        <FormulaireMissionCollecte />
      </div>
    </div>
  );
}
