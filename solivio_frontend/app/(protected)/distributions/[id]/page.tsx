import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeuilleDistribution, type OngletFeuille } from "@/components/distributions/FeuilleDistribution";
import { FicheMembre } from "@/components/distributions/FicheMembre";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estGestionnaireDistribution, peutPointer, typeInscriptionPossible } from "@/lib/droits-distribution";
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
    const monInscription = mesInscriptions.find((i) => i.statut === "CONFIRMEE" || i.statut === "LISTE_ATTENTE");
    return (
      <FicheMembre
        distribution={distribution}
        monInscription={monInscription}
        type={typeInscriptionPossible(roles)}
        pointageBenevole={peutPointer(roles, distribution.statut, mesInscriptions)}
      />
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
      monInscription={(mesInscriptions ?? []).find((i) => i.statut === "CONFIRMEE" || i.statut === "LISTE_ATTENTE")}
      typeInscription={typeInscriptionPossible(roles)}
    />
  );
}
