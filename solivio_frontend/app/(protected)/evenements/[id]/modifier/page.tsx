import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormulaireEvenement } from "@/components/evenement/FormulaireEvenement";
import { PageHeader } from "@/components/ui/page-header";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estResponsable } from "@/lib/roles";
import type { EvenementResponse } from "@/types/evenement";

export const metadata: Metadata = { title: "Modifier l'événement" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModifierEvenementPage({ params }: PageProps) {
  const { id } = await params;
  const [evenement, me] = await Promise.all([
    lireServeur<EvenementResponse>(`/api/evenements/${id}`),
    lireMoi(),
  ]);
  if (!evenement || !estResponsable(me?.roles ?? [])) notFound();
  // Le backend ne modifie qu'un brouillon : une fois publié, l'événement s'annule.
  if (evenement.statut !== "BROUILLON") redirect(`/evenements/${id}`);

  return (
    <>
      <PageHeader retour={{ href: `/evenements/${id}`, libelle: "Événement" }} titre="Modifier l'événement" description="Un événement se modifie tant qu'il est en brouillon. Une fois publié, il ne peut plus qu'être annulé." />
      <FormulaireEvenement evenement={evenement} />
    </>
  );
}
