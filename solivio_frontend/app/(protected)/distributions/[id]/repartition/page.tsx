import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { RepartitionPanel } from "@/components/repartition/RepartitionPanel";
import { dateLongue } from "@/lib/agenda";
import { lireServeur } from "@/lib/api/serveur";
import type { DenreeResponse, DistributionResponse, DotationResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Répartition des denrées" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RepartitionPage({ params }: PageProps) {
  const { id } = await params;
  const [distribution, denrees, dotation] = await Promise.all([
    lireServeur<DistributionResponse>(`/api/distributions/${id}`),
    lireServeur<DenreeResponse[]>(`/api/distributions/${id}/denrees`),
    lireServeur<DotationResponse>(`/api/distributions/${id}/repartition`),
  ]);
  if (!distribution || !denrees || !dotation) notFound();
  const jour = dateLongue(distribution.date);
  const intitule = jour.charAt(0).toUpperCase() + jour.slice(1);

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <PageHeader
        className="print:hidden"
        retour={{ href: `/distributions/${id}?onglet=denrees`, libelle: "Distribution" }}
        surtitre={intitule}
        titre="Répartition des denrées"
        description="Notez ce qui a été reçu : Solivio calcule ce que chacun emporte."
      />
      <RepartitionPanel
        distributionId={id}
        denreesInitiales={denrees}
        dotationInitiale={dotation}
        modifiable={distribution.statut !== "TERMINEE" && distribution.statut !== "ANNULEE"}
        intitule={intitule}
      />
    </div>
  );
}
