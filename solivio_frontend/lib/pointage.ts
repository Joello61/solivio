import type { PointageInfoResponse, StatutPresence } from "@/types/distribution";

// NON_POINTE sert a annuler un pointage fait par erreur.
export type PresencePointee = "PRESENT" | "ABSENT" | "NON_POINTE";

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

export interface GroupeCreneau {
  cle: string;
  debut: string | null;
  fin: string | null;
  courant: boolean;
  lignes: LignePointage[];
}

const RANG_COURANT = 0;
const RANG_A_VENIR = 1;
const RANG_PASSE = 2;
const RANG_SANS_HORAIRE = 3;

/*
 * Lignes groupees par creneau, le creneau en cours d'abord, puis ceux a venir,
 * puis ceux deja passes, du plus recent au plus ancien, pour les retardataires. `maintenant`
 * est l'heure locale "HH:MM", null tant qu'elle n'est pas connue.
 */
export function grouperParCreneau(lignes: LignePointage[], maintenant: string | null): GroupeCreneau[] {
  const groupes = new Map<string, GroupeCreneau>();
  for (const ligne of lignes) {
    const debut = ligne.heureCreneauDebut?.slice(0, 5) ?? null;
    const fin = ligne.heureCreneauFin?.slice(0, 5) ?? null;
    const cle = debut ? `${debut}-${fin ?? ""}` : "sans-horaire";
    const groupe = groupes.get(cle);
    if (groupe) groupe.lignes.push(ligne);
    else groupes.set(cle, { cle, debut, fin, courant: false, lignes: [ligne] });
  }
  const rang = (g: GroupeCreneau) => {
    if (!g.debut) return RANG_SANS_HORAIRE;
    if (!maintenant || g.debut > maintenant) return RANG_A_VENIR;
    return g.fin && maintenant < g.fin ? RANG_COURANT : RANG_PASSE;
  };
  return [...groupes.values()]
    .map((g) => ({ ...g, courant: rang(g) === RANG_COURANT }))
    .sort((a, b) => {
      const ecart = rang(a) - rang(b);
      if (ecart !== 0) return ecart;
      // Parmi les creneaux passes, le plus recent d'abord.
      const ordre = (a.debut ?? "").localeCompare(b.debut ?? "");
      return rang(a) === RANG_PASSE ? -ordre : ordre;
    });
}
