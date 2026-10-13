export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  responsable: "Responsable",
  coordinateur: "Coordinateur",
  benevole: "Bénévole",
  beneficiaire: "Bénéficiaire",
};

export function libelleRole(role: string, statutMembre?: string | null): string {
  const libelle = ROLE_LABELS[role] ?? role;
  return statutMembre === "suspendu" ? `${libelle} (suspendu)` : libelle;
}

// Evenements et missions de collecte sont geres par les responsables (backend).
export function estResponsable(roles: string[]): boolean {
  return roles.some((r) => r === "responsable" || r === "super_admin");
}
