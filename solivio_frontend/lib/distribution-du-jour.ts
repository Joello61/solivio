import type { DistributionResponse } from "@/types/distribution";

export interface InscriptionDuMembre {
  distributionId: string;
  type: string;
  statut: string;
}

const STATUTS_DU_JOUR = ["PUBLIEE", "EN_COURS"];

/** Date du jour (AAAA-MM-JJ) dans le fuseau de l'association. */
export function jourAssociation(maintenant: Date, fuseau = "Europe/Paris"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuseau }).format(maintenant);
}

/**
 * Distributions du jour a mettre en avant : toutes pour un gestionnaire, celles ou le
 * membre est benevole confirme sinon. Les distributions en cours passent en premier.
 */
export function distributionsDuJour(
  distributions: DistributionResponse[],
  jour: string,
  gestionnaire: boolean,
  inscriptions: InscriptionDuMembre[],
): DistributionResponse[] {
  const benevoleSur = new Set(
    inscriptions.filter((i) => i.type === "BENEVOLE" && i.statut === "CONFIRMEE").map((i) => i.distributionId),
  );
  return distributions
    .filter((d) => d.date === jour && STATUTS_DU_JOUR.includes(d.statut))
    .filter((d) => gestionnaire || benevoleSur.has(d.id))
    .sort((a, b) => Number(b.statut === "EN_COURS") - Number(a.statut === "EN_COURS"));
}
