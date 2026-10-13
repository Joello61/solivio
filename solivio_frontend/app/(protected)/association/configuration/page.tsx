import type { Metadata } from "next";
import { lireServeur } from "@/lib/api/serveur";
import { ExportDonnees } from "@/components/association/ExportDonnees";
import { FormulaireConfiguration } from "@/components/association/FormulaireConfiguration";
import type { AssociationResponse } from "@/types/association";

export const metadata: Metadata = { title: "Configuration de l'association" };


export default async function ConfigurationPage() {
  const association = await lireServeur<AssociationResponse>("/api/association");

  if (!association) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground font-display">Configuration</h1>
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Impossible de charger la configuration de l&apos;association.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paramètres de l&apos;association {association.nom}.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6">
        <FormulaireConfiguration association={association} />
      </div>

      <ExportDonnees />
    </div>
  );
}
