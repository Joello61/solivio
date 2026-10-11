import type { Metadata } from "next";
import { FormulaireEvenement } from "@/components/evenement/FormulaireEvenement";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";

export const metadata: Metadata = { title: "Nouvel événement" };

export default function NouvelEvenementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">
          Nouvel événement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Créez un événement associatif et configurez son accès.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Formulaire multi-step */}
        <div>
          <FormulaireEvenement />
        </div>

        {/* Panneau info - masqué sur mobile */}
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/événement.jpg"
            imageAlt="Événement associatif"
            titre="Événement associatif"
            description="Un événement peut être un stand, une fête ou toute autre activité de l'association. Il peut accueillir du staff bénévole et/ou des participants."
            points={[
              "Choisissez le type d'événement (stand, fête, autre)",
              "Définissez le lieu et les horaires précisément",
              "Activez le besoin de staff pour recruter des bénévoles",
              "Ouvrez l'accès aux participants si besoin",
              "Le mode d'inscription détermine le niveau de suivi",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
