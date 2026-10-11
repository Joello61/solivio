import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormulaireMissionCollecte } from "@/components/collecte/FormulaireMissionCollecte";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estResponsable } from "@/lib/roles";
import type { MissionCollecteResponse } from "@/types/collecte";

export const metadata: Metadata = { title: "Modifier la mission" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModifierMissionPage({ params }: PageProps) {
  const { id } = await params;
  const [mission, me] = await Promise.all([
    lireServeur<MissionCollecteResponse>(`/api/missions-collecte/${id}`),
    lireMoi(),
  ]);
  if (!mission || !estResponsable(me?.roles ?? [])) notFound();
  // Une mission prise en charge n'est plus modifiable (backend).
  if (mission.statut !== "DISPONIBLE") redirect(`/missions-collecte/${id}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Modifier la mission</h1>
        <p className="text-sm text-muted-foreground mt-1">{mission.titre}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-5">
          <FormulaireMissionCollecte mission={mission} />
        </div>
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/mission-collecte.jpg"
            imageAlt="Mission de collecte alimentaire"
            titre="Tant qu'elle est disponible"
            description="Une mission se modifie jusqu'à ce qu'un bénévole la prenne en charge."
            points={[
              "Une fois prise en charge, elle ne peut plus qu'être annulée",
              "Un champ vidé conserve la valeur actuelle",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
