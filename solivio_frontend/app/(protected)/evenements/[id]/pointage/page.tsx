import { notFound } from "next/navigation";
import { lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import { PointageEvenementClient } from "./PointageEvenementClient";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";

export const metadata: Metadata = { title: "Pointage événement" };

async function fetchData(id: string) {
  const [evenement, participations] = await Promise.all([
    lireServeur<EvenementResponse>(`/api/evenements/${id}`),
    lireServeur<ParticipationEvenementResponse[]>(`/api/evenements/${id}/pointage`),
  ]);
  return { evenement, participations: participations ?? [] };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PointageEvenementPage({ params }: Props) {
  const { id } = await params;
  const { evenement, participations } = await fetchData(id);

  if (!evenement) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Pointage</h1>
        <p className="text-sm text-muted-foreground mt-1">{evenement.titre}</p>
      </div>
      <PointageEvenementClient
        evenementId={id}
        participationsInitiales={participations}
      />
    </div>
  );
}
