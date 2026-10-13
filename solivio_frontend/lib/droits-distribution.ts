import type { InscriptionResponse, StatutDistribution, TypeInscription } from "@/types/distribution";

const GESTIONNAIRES = ["coordinateur", "responsable", "super_admin"];
// Spec 4.5 et regle C2 du backend : le benevolat est ouvert a tous les membres sauf
// aux beneficiaires, qui s'inscrivent comme beneficiaires.
const ROLES_BENEVOLAT = ["benevole", "coordinateur", "responsable"];

export function estGestionnaireDistribution(roles: string[]): boolean {
  return roles.some((r) => GESTIONNAIRES.includes(r));
}

/** Type d'inscription que le backend accepte pour ces roles, ou null. */
export function typeInscriptionPossible(roles: string[]): TypeInscription | null {
  if (roles.includes("beneficiaire")) return "BENEFICIAIRE";
  if (roles.some((r) => ROLES_BENEVOLAT.includes(r))) return "BENEVOLE";
  return null;
}

/**
 * Le backend ouvre le pointage aux gestionnaires et aux benevoles confirmes sur
 * cette distribution, une fois celle-ci demarree.
 */
export function peutPointer(
  roles: string[],
  statut: StatutDistribution,
  mesInscriptions: InscriptionResponse[],
): boolean {
  if (statut !== "EN_COURS") return false;
  return (
    estGestionnaireDistribution(roles) ||
    mesInscriptions.some((i) => i.type === "BENEVOLE" && i.statut === "CONFIRMEE")
  );
}
