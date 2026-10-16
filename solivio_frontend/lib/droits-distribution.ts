import type { TypeInscription } from "@/types/distribution";

const GESTIONNAIRES = ["coordinateur", "responsable", "super_admin"];

export function estGestionnaireDistribution(roles: string[]): boolean {
  return roles.some((r) => GESTIONNAIRES.includes(r));
}

/**
 * Types d'inscription que le backend accepte pour ces roles (ADR-012) : chacun demande
 * son role, et une personne benevole et beneficiaire peut prendre les deux places.
 * Beneficiaire d'abord : c'est la vue principale de ces membres.
 */
export function typesInscriptionPossibles(roles: string[]): TypeInscription[] {
  return [
    ...(roles.includes("beneficiaire") ? (["BENEFICIAIRE"] as const) : []),
    ...(roles.includes("benevole") ? (["BENEVOLE"] as const) : []),
  ];
}
