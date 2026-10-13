export interface InscriptionAClasser {
  statut: string;
  distributionDate: string | null;
  distributionStatut: string | null;
}

const DISTRIBUTION_FINIE = ["TERMINEE", "ANNULEE"];

/**
 * Une inscription est a venir si elle est active et que sa distribution, datee d'aujourd'hui
 * ou plus tard, n'est ni terminee ni annulee : une distribution close le jour meme passe a
 * l'historique.
 */
export function estAVenir(i: InscriptionAClasser, jour: string): boolean {
  return (
    i.statut !== "ANNULEE" &&
    i.distributionDate !== null &&
    i.distributionDate >= jour &&
    !DISTRIBUTION_FINIE.includes(i.distributionStatut ?? "")
  );
}
