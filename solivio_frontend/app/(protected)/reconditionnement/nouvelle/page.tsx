import type { Metadata } from "next";
import { FormulaireSession } from "@/components/reconditionnement/FormulaireSession";

export const metadata: Metadata = { title: "Nouvelle session de reconditionnement" };

export default function NouvelleSessionPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          Nouvelle session de reconditionnement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Creez une session de reconditionnement pour les benevoles.
        </p>
      </div>
      <FormulaireSession />
    </div>
  );
}
