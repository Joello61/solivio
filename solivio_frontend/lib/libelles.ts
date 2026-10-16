import type { StatutMission } from "@/types/collecte";
import type { StatutDistribution, StatutInscription, StatutPresence } from "@/types/distribution";
import type { StatutEvenement } from "@/types/evenement";
import type { StatutSession } from "@/types/reconditionnement";

/*
 * Ton visuel d'un statut, independant de la couleur exacte : "maintenant" pour ce
 * qui se passe en ce moment (jaune), "ouvert" pour ce qui attend une action,
 * "passe" pour ce qui est clos. Le vocabulaire suit docs/glossaire.md.
 */
export type TonStatut =
  | "maintenant"
  | "ouvert"
  | "brouillon"
  | "passe"
  | "annule"
  | "attente"
  | "succes"
  | "info";

export interface LibelleStatut {
  texte: string;
  ton: TonStatut;
}

const CYCLE = {
  brouillon: { texte: "Brouillon", ton: "brouillon" },
  enCours: { texte: "En cours", ton: "maintenant" },
} as const satisfies Record<string, LibelleStatut>;

export const STATUT_DISTRIBUTION: Record<StatutDistribution, LibelleStatut> = {
  BROUILLON: CYCLE.brouillon,
  PUBLIEE: { texte: "Publiée", ton: "ouvert" },
  EN_COURS: CYCLE.enCours,
  TERMINEE: { texte: "Terminée", ton: "passe" },
  ANNULEE: { texte: "Annulée", ton: "annule" },
};

export const STATUT_SESSION: Record<StatutSession, LibelleStatut> = STATUT_DISTRIBUTION;

export const STATUT_EVENEMENT: Record<StatutEvenement, LibelleStatut> = {
  BROUILLON: CYCLE.brouillon,
  PUBLIE: { texte: "Publié", ton: "ouvert" },
  EN_COURS: CYCLE.enCours,
  TERMINE: { texte: "Terminé", ton: "passe" },
  ANNULE: { texte: "Annulé", ton: "annule" },
};

export const STATUT_MISSION: Record<StatutMission, LibelleStatut> = {
  DISPONIBLE: { texte: "Disponible", ton: "ouvert" },
  PRISE_EN_CHARGE: { texte: "Prise en charge", ton: "maintenant" },
  COLLECTE_EFFECTUEE: { texte: "Collectée", ton: "info" },
  DEPOT_VALIDE: { texte: "Déposée", ton: "passe" },
  ANNULEE: { texte: "Annulée", ton: "annule" },
};

export const STATUT_INSCRIPTION: Record<StatutInscription, LibelleStatut> = {
  CONFIRMEE: { texte: "Confirmée", ton: "ouvert" },
  LISTE_ATTENTE: { texte: "Liste d'attente", ton: "attente" },
  ANNULEE: { texte: "Annulée", ton: "passe" },
};

// Formes neutres : la personne pointee n'a pas a etre genree.
export const STATUT_PRESENCE: Record<StatutPresence, LibelleStatut> = {
  NON_POINTE: { texte: "À pointer", ton: "brouillon" },
  PRESENT: { texte: "Présence notée", ton: "succes" },
  ABSENT: { texte: "Absence", ton: "passe" },
};
