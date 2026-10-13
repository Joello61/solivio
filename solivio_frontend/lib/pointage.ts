import type { PointageInfoResponse, StatutPresence } from "@/types/distribution";

export type PresencePointee = "PRESENT" | "ABSENT";

export interface EnvoiPointage {
  inscriptionId: string;
  presence: PresencePointee;
  statut: "idle" | "pending" | "success" | "error";
  enPause: boolean;
  soumisA: number;
}

export type EtatEnvoi = "envoi" | "attente" | "echec" | null;

export interface LignePointage extends PointageInfoResponse {
  etat: EtatEnvoi;
  derniereDemande: PresencePointee | null;
}

/**
 * Superpose aux donnees du serveur les pointages pas encore confirmes : la ligne
 * affiche tout de suite la presence demandee, et son etat d'envoi. Seul le dernier
 * envoi de chaque ligne compte ; un echec definitif rend la presence du serveur.
 */
export function lignesAffichees(serveur: PointageInfoResponse[], envois: EnvoiPointage[]): LignePointage[] {
  const dernier = new Map<string, EnvoiPointage>();
  for (const e of envois) {
    const actuel = dernier.get(e.inscriptionId);
    if (!actuel || e.soumisA >= actuel.soumisA) dernier.set(e.inscriptionId, e);
  }
  return serveur.map((ligne) => {
    const envoi = dernier.get(ligne.inscriptionId);
    if (!envoi || envoi.statut === "success" || envoi.statut === "idle") {
      return { ...ligne, etat: null, derniereDemande: null };
    }
    if (envoi.statut === "error") {
      return { ...ligne, etat: "echec", derniereDemande: envoi.presence };
    }
    return {
      ...ligne,
      presence: envoi.presence as StatutPresence,
      etat: envoi.enPause ? "attente" : "envoi",
      derniereDemande: envoi.presence,
    };
  });
}

/** Ordre alphabetique par nom puis prenom, insensible aux accents. */
export function trierParNom(lignes: LignePointage[]): LignePointage[] {
  return [...lignes].sort(
    (a, b) =>
      a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }) ||
      a.prenom.localeCompare(b.prenom, "fr", { sensitivity: "base" }),
  );
}

export function correspond(ligne: PointageInfoResponse, recherche: string): boolean {
  const terme = recherche.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
  if (!terme) return true;
  const texte = `${ligne.nom} ${ligne.prenom}`.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
  return texte.includes(terme);
}

// Pas de nouvelle tentative sur un refus du serveur (4xx) : il ne changera pas d'avis.
export function doitReessayer(tentatives: number, erreur: unknown): boolean {
  const statut = (erreur as { status?: number }).status;
  if (statut !== undefined && statut >= 400 && statut < 500) return false;
  return tentatives < 5;
}

export function delaiNouvelEssai(tentative: number): number {
  return Math.min(1000 * 2 ** tentative, 15_000);
}
