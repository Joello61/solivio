import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeuilleDistribution, type OngletFeuille } from "@/components/distributions/FeuilleDistribution";
import { FicheMembre } from "@/components/distributions/FicheMembre";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estGestionnaireDistribution, typesInscriptionPossibles } from "@/lib/droits-distribution";
import { rolesAttribuables } from "@/lib/roles-benevoles";
import type { StatistiqueDistributionResponse } from "@/types/association";
import type { DistributionResponse, InscriptionResponse, TypeRoleResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Distribution" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}

export default async function DistributionDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { onglet }] = await Promise.all([params, searchParams]);
  const [distribution, me] = await Promise.all([
    lireServeur<DistributionResponse>(`/api/distributions/${id}`),
    lireMoi(),
  ]);
  if (!distribution) notFound();
  const roles = me?.roles ?? [];

  if (!estGestionnaireDistribution(roles)) {
    const mesInscriptions = (await lireServeur<InscriptionResponse[]>(`/api/distributions/${id}/inscriptions/mes`)) ?? [];
    return (
      <FicheMembre distribution={distribution} mesInscriptions={mesInscriptions} types={typesInscriptionPossibles(roles)} />
    );
  }

  const [inscrits, mesInscriptions, stats, typesRoles] = await Promise.all([
    lireServeur<InscriptionResponse[]>(`/api/distributions/${id}/inscriptions`),
    lireServeur<InscriptionResponse[]>(`/api/distributions/${id}/inscriptions/mes`),
    distribution.statut === "TERMINEE"
      ? lireServeur<StatistiqueDistributionResponse>(`/api/statistiques/distributions/${id}`)
      : null,
    lireServeur<TypeRoleResponse[]>("/api/types-roles"),
  ]);

  return (
    <FeuilleDistribution
      distribution={distribution}
      inscrits={inscrits ?? []}
      stats={stats}
      roles={rolesAttribuables(typesRoles ?? [])}
      onglet={(onglet as OngletFeuille | undefined) ?? "vue"}
      aujourdhui={jourAssociation(new Date())}
      mesInscriptions={mesInscriptions ?? []}
      typesInscription={typesInscriptionPossibles(roles)}
    />
  );
}
