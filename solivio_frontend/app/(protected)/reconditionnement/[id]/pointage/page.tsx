import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PointageSession } from "@/components/reconditionnement/PointageSession";
import { lireServeur } from "@/lib/api/serveur";
import type { InscriptionReconditionnementResponse, SessionReconditionnementResponse } from "@/types/reconditionnement";

export const metadata: Metadata = { title: "Pointage" };

export default async function PointageSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, inscrits] = await Promise.all([
    lireServeur<SessionReconditionnementResponse>(`/api/sessions-reconditionnement/${id}`),
    lireServeur<InscriptionReconditionnementResponse[]>(`/api/sessions-reconditionnement/${id}/inscrits`),
  ]);
  // Les inscrits ne sont lisibles que des gestionnaires ; le pointage n'existe que pendant ou apres.
  if (!session || !inscrits || (session.statut !== "EN_COURS" && session.statut !== "TERMINEE")) notFound();

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background">
      <PointageSession sessionId={id} intitule={session.titre} inscrits={inscrits.filter((i) => i.statut === "CONFIRMEE")} />
    </div>
  );
}
