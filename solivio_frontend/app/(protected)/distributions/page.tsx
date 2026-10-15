import type { Metadata } from "next";
import { AgendaMembre } from "@/components/agenda/AgendaMembre";
import { PlanningGestion } from "@/components/distributions/PlanningGestion";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estGestionnaireDistribution, typeInscriptionPossible } from "@/lib/droits-distribution";
import type { DistributionResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Agenda" };

export default async function DistributionsPage({ searchParams }: { searchParams: Promise<{ section?: string; type?: string }> }) {
  const [{ section, type: filtre }, me, distributions] = await Promise.all([
    searchParams,
    lireMoi(),
    lireServeur<DistributionResponse[]>("/api/distributions"),
  ]);
  const roles = me?.roles ?? [];
  const type = typeInscriptionPossible(roles);
  if (!estGestionnaireDistribution(roles) && type) {
    return <AgendaMembre distributions={distributions ?? []} type={type} roles={roles} filtre={filtre} />;
  }
  return <PlanningGestion distributions={distributions ?? []} section={section} aujourdhui={jourAssociation(new Date())} />;
}
