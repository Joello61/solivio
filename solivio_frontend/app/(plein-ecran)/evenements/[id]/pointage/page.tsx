import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PointageEvenement } from "@/components/evenement/PointageEvenement";
import { lireServeur } from "@/lib/api/serveur";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";

export const metadata: Metadata = { title: "Pointage" };

export default async function PointageEvenementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [evenement, participations] = await Promise.all([
    lireServeur<EvenementResponse>(`/api/evenements/${id}`),
    lireServeur<ParticipationEvenementResponse[]>(`/api/evenements/${id}/pointage`),
  ]);
  // Le backend refuse le pointage hors inscription obligatoire et aux non-gestionnaires.
  if (!evenement || !participations) notFound();

  // Plein ecran, sans navigation, comme le jour J d'une distribution.
  return (
    <main className="min-h-dvh bg-background">
      <PointageEvenement evenementId={id} intitule={evenement.titre} participations={participations} />
    </main>
  );
}
