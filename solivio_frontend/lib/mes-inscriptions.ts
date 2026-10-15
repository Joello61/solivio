import type { InscriptionPersonnelle } from "@/types/distribution";
import type { PositionLieu } from "@/lib/lieu";

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

export interface DonneesBillet {
  inscriptionId: string;
  distributionId: string;
  date: string;
  heureDebut: string | null;
  heureFin: string | null;
  lieuNom: string | null;
  adresse: string | null;
  statut: "CONFIRMEE" | "LISTE_ATTENTE";
  rangListeAttente: number | null;
  benevole: boolean;
  /* Le backend refuse la desinscription une fois la presence pointee. */
  desinscriptionPossible: boolean;
  position?: PositionLieu;
}

/* Inscriptions a venir, la plus proche d'abord. */
export function inscriptionsAVenir(inscriptions: InscriptionPersonnelle[], jour: string): InscriptionPersonnelle[] {
  return inscriptions
    .filter((i) => estAVenir(i, jour))
    .sort((a, b) => (a.distributionDate ?? "").localeCompare(b.distributionDate ?? "")
      || (a.heureDebut ?? "").localeCompare(b.heureDebut ?? ""));
}

/* Une inscription a venir est active et datee : estAVenir l'a verifie. */
export function versBillet(i: InscriptionPersonnelle): DonneesBillet {
  return {
    inscriptionId: i.id,
    distributionId: i.distributionId,
    date: i.distributionDate ?? "",
    heureDebut: i.heureDebut,
    heureFin: i.heureFin,
    lieuNom: i.distributionLieuNom,
    adresse: i.distributionLieu,
    statut: i.statut === "LISTE_ATTENTE" ? "LISTE_ATTENTE" : "CONFIRMEE",
    rangListeAttente: i.rangListeAttente,
    benevole: i.type === "BENEVOLE",
    desinscriptionPossible: i.presence === "NON_POINTE",
  };
}
