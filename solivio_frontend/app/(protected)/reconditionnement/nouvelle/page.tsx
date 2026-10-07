import type { Metadata } from "next";
import { FormulaireSession } from "@/components/reconditionnement/FormulaireSession";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";

export const metadata: Metadata = { title: "Nouvelle session de reconditionnement" };

export default function NouvelleSessionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          Nouvelle session de reconditionnement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Créez une session de reconditionnement pour les bénévoles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Formulaire dans une card */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-5">
          <FormulaireSession />
        </div>

        {/* Panneau info - masqué sur mobile */}
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/reco-session.jpg"
            imageAlt="Bénévoles lors d'une session de reconditionnement"
            titre="Session de reconditionnement"
            description="Une session de reconditionnement réunit des bénévoles pour trier, nettoyer et remettre en état des articles avant redistribution aux bénéficiaires."
            points={[
              "Définissez un titre clair et une plage horaire précise",
              "Le lieu indique où se tient physiquement la session",
              "La capacité limite le nombre d'inscrits bénévoles",
              "Les bénévoles peuvent s'inscrire depuis leur espace personnel",
              "Vous pourrez gérer les présences après création",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
