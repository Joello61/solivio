import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { CreateDistributionForm } from "@/components/distributions/CreateDistributionForm";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { dateLongue } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import type { DistributionResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Modifier la distribution" };

export default async function ModifierDistributionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [distribution, me] = await Promise.all([
    lireServeur<DistributionResponse>(`/api/distributions/${id}`),
    lireMoi(),
  ]);
  if (!distribution || !estGestionnaireDistribution(me?.roles ?? [])) notFound();
  // Une distribution demarree, terminee ou annulee n'est plus modifiable (backend).
  if (distribution.statut !== "BROUILLON" && distribution.statut !== "PUBLIEE") redirect(`/distributions/${id}`);

  return (
    <div>
      <PageHeader
        retour={{ href: `/distributions/${id}`, libelle: "Distribution" }}
        titre="Modifier la distribution"
        description={
          distribution.statut === "PUBLIEE"
            ? `Celle du ${dateLongue(distribution.date)}, déjà publiée : si la date, le lieu ou les horaires changent, les inscrits sont prévenus par email.`
            : `Brouillon du ${dateLongue(distribution.date)}.`
        }
      />
      <CreateDistributionForm distribution={distribution} aujourdhui={jourAssociation(new Date())} />
    </div>
  );
}
