import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormulaireMissionCollecte } from "@/components/collecte/FormulaireMissionCollecte";
import { PageHeader } from "@/components/ui/page-header";
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
    <>
      <PageHeader retour={{ href: `/missions-collecte/${id}`, libelle: "Mission" }} titre="Modifier la mission" description="Une mission se modifie jusqu'à ce qu'un bénévole la prenne en charge." />
      <FormulaireMissionCollecte mission={mission} />
    </>
  );
}
