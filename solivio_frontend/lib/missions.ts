import type { StatutMission } from "@/types/collecte";

export type ActionPrincipale = "prendre" | "valider-collecte" | "valider-depot";
export type Action = ActionPrincipale | "liberer" | "modifier" | "annuler";

export interface DroitsMission {
  statut: StatutMission;
  assigneAuLecteur: boolean;
  estGestionnaire: boolean;
  estBenevole: boolean;
}

const EN_COURS: StatutMission[] = ["DISPONIBLE", "PRISE_EN_CHARGE", "COLLECTE_EFFECTUEE"];

/*
 * Actions ouvertes par le backend a ce lecteur, rangees en une action principale
 * (l'etape suivante de la mission) et des actions rares pour le menu "Plus".
 */
export function actionsMission({ statut, assigneAuLecteur, estGestionnaire, estBenevole }: DroitsMission): {
  principale: ActionPrincipale | null;
  autres: Action[];
} {
  let principale: ActionPrincipale | null = null;
  if (estBenevole && statut === "DISPONIBLE") principale = "prendre";
  else if (estGestionnaire && statut === "PRISE_EN_CHARGE") principale = "valider-collecte";
  else if (estBenevole && assigneAuLecteur && statut === "COLLECTE_EFFECTUEE") principale = "valider-depot";

  const autres: Action[] = [];
  if (estGestionnaire && statut === "DISPONIBLE") autres.push("modifier");
  if (estBenevole && assigneAuLecteur && statut === "PRISE_EN_CHARGE") autres.push("liberer");
  if ((estGestionnaire || assigneAuLecteur) && EN_COURS.includes(statut)) autres.push("annuler");
  return { principale, autres };
}
