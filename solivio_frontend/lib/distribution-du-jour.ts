import type { DistributionResponse } from "@/types/distribution";

const STATUTS_DU_JOUR = ["PUBLIEE", "EN_COURS"];

/** Date du jour (AAAA-MM-JJ) dans le fuseau de l'association. */
export function jourAssociation(maintenant: Date, fuseau = "Europe/Paris"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuseau }).format(maintenant);
}

/**
 * Distributions du jour a mettre en avant pour un gestionnaire, seul a pointer
 * (ADR-012). Les distributions en cours passent en premier.
 */
export function distributionsDuJour(distributions: DistributionResponse[], jour: string): DistributionResponse[] {
  return distributions
    .filter((d) => d.date === jour && STATUTS_DU_JOUR.includes(d.statut))
    .sort((a, b) => Number(b.statut === "EN_COURS") - Number(a.statut === "EN_COURS"));
}
