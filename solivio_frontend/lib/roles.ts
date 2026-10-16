export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  responsable: "Responsable",
  coordinateur: "Coordinateur",
  benevole: "Bénévole",
  beneficiaire: "Bénéficiaire",
};

/** Roles que l'on choisit seul, a l'inscription ou depuis son compte (ADR-012). */
export const ROLES_LIBRES = ["benevole", "beneficiaire"] as const;
export type RoleLibre = (typeof ROLES_LIBRES)[number];

/** Roles qu'un responsable attribue ; responsable ne se cumule avec aucun autre. */
export const ROLES_CUMULABLES = ["coordinateur", "benevole", "beneficiaire"] as const;

/** Sous-types libres d'un coordinateur (membre.coordo_type). */
export const SANS_TYPE_COORDINATION = "aucun";
export const TYPES_COORDINATION = [
  { value: SANS_TYPE_COORDINATION, label: "Non précisé" },
  { value: "coordo_generale", label: "Coordination générale" },
  { value: "coordo_sec", label: "Produits secs" },
  { value: "coordo_fruit_legume", label: "Fruits et légumes" },
  { value: "coordo_exterieur", label: "Extérieur" },
];

/** Libelle de plusieurs roles, dans l'ordre de la gestion ("Coordinateur, Bénévole"). */
export function libelleRoles(roles: string[]): string {
  const ordre = ["responsable", ...ROLES_CUMULABLES];
  return [...roles]
    .sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b))
    .map((r) => ROLE_LABELS[r] ?? r)
    .join(", ");
}

// Evenements et missions de collecte sont geres par les responsables (backend).
export function estResponsable(roles: string[]): boolean {
  return roles.some((r) => r === "responsable" || r === "super_admin");
}
