import type { Metadata } from "next";
import { FormulaireMissionCollecte } from "@/components/collecte/FormulaireMissionCollecte";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";

export const metadata: Metadata = { title: "Nouvelle mission collecte" };

export default function NouvelleMissionCollectePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">
          Nouvelle mission
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez les détails de la mission de collecte.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Formulaire dans une card */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-5">
          <FormulaireMissionCollecte />
        </div>

        {/* Panneau info — masqué sur mobile */}
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/mission-collecte.jpg"
            imageAlt="Mission de collecte alimentaire"
            titre="Mission de collecte"
            description="Une mission collecte mobilise des bénévoles pour récupérer des dons auprès de particuliers ou de commerçants et les acheminer vers l'entrepôt de l'association."
            points={[
              "Précisez l'adresse de collecte et le lieu de dépôt",
              "La date et l'heure permettent de planifier l'intervention",
              "Limitez le nombre de bénévoles selon le besoin",
              "Les bénévoles reçoivent les détails une fois inscrits",
              "Un responsable peut être désigné après création",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
