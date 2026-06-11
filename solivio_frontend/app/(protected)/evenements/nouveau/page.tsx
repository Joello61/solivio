import type { Metadata } from "next";
import { FormulaireEvenement } from "@/components/evenement/FormulaireEvenement";

export const metadata: Metadata = { title: "Nouvel evenement" };

export default function NouvelEvenementPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground font-display">Nouvel evenement</h1>
      <FormulaireEvenement />
    </div>
  );
}
