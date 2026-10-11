import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormulaireEvenement } from "@/components/evenement/FormulaireEvenement";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Modifier l&apos;événement</h1>
        <p className="text-sm text-muted-foreground mt-1">{evenement.titre}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div>
          <FormulaireEvenement evenement={evenement} />
        </div>
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/evenement.jpg"
            imageAlt="Événement associatif"
            titre="Avant publication"
            description="Un événement se modifie tant qu'il est en brouillon. Une fois publié, il ne peut plus qu'être annulé."
            points={[
              "Vérifiez les horaires et le lieu avant de publier",
              "Une capacité laissée vide conserve la valeur actuelle",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
