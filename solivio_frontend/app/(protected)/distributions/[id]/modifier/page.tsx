import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CreateDistributionForm } from "@/components/distributions/CreateDistributionForm";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import type { DistributionResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Modifier la distribution" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModifierDistributionPage({ params }: PageProps) {
  const { id } = await params;
  const [distribution, me] = await Promise.all([
    lireServeur<DistributionResponse>(`/api/distributions/${id}`),
    lireMoi(),
  ]);
  if (!distribution || !estGestionnaireDistribution(me?.roles ?? [])) notFound();
  // Une distribution demarree, terminee ou annulee n'est plus modifiable (backend).
  if (distribution.statut !== "BROUILLON" && distribution.statut !== "PUBLIEE") redirect(`/distributions/${id}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Modifier la distribution</h1>
        <p className="text-muted-foreground mt-1 text-sm">{distribution.titre}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div>
          <CreateDistributionForm distribution={distribution} />
        </div>
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/distribution.jpg"
            imageAlt="Distribution alimentaire"
            titre="Ce qui est protégé"
            description="Les places déjà attribuées ne peuvent pas être retirées aux inscrits."
            points={[
              "Une capacité ne descend pas sous le nombre d'inscrits confirmés",
              "Un créneau qui a reçu des inscriptions ne peut pas être supprimé",
              "Changer la date, le lieu ou les horaires prévient les inscrits par email",
              "Augmenter une capacité fait avancer la liste d'attente",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
