import type { Metadata } from "next";
import { CreateDistributionForm } from "@/components/distributions/CreateDistributionForm";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";

export const metadata: Metadata = { title: "Nouvelle distribution" };

export default function NouvellePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">
          Nouvelle distribution
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Remplissez les informations pour créer une nouvelle distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Formulaire multi-step */}
        <div>
          <CreateDistributionForm />
        </div>

        {/* Panneau info - masqué sur mobile */}
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/distribution.jpg"
            imageAlt="Distribution alimentaire"
            titre="Distribution alimentaire"
            description="Une distribution est un événement planifié où des denrées ou articles sont remis aux bénéficiaires selon des créneaux horaires définis."
            points={[
              "Définissez la date et le lieu de la distribution",
              "Fixez la capacité bénéficiaires et bénévoles",
              "Créez un ou plusieurs créneaux horaires",
              "Les bénéficiaires peuvent s'inscrire sur un créneau",
              "Le pointage est disponible le jour J",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
