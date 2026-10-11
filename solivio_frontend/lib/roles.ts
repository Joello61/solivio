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
