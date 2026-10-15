import type { MissionCollecteResponse } from "@/types/collecte";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";
import type { InscriptionReconditionnementResponse } from "@/types/reconditionnement";

export type TypeEngagement = "evenement" | "mission" | "session";

/* Un engagement hors distribution, ramene a ce qu'il faut pour une ligne d'agenda. */
export interface Engagement {
  cle: string;
  type: TypeEngagement;
  /* Jour (aaaa-mm-jj) et heure (hh:mm) dans le fuseau de l'association. */
  date: string;
  heure: string;
  titre: string;
  lieu: string | null;
  /* Precision courte : role, etape de la mission. */
  detail: string;
  href: string;
  aVenir: boolean;
}

export const LIBELLE_TYPE: Record<TypeEngagement, string> = {
  evenement: "Événement",
  mission: "Mission de collecte",
  session: "Reconditionnement",
};

const FUSEAU = "Europe/Paris";
const JOUR = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU });
const HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" });

/** Jour (aaaa-mm-jj) et heure (hh:mm) d'un instant, dans le fuseau de l'association. */
export function jourEtHeure(iso: string): { date: string; heure: string } {
  const d = new Date(iso);
  return { date: JOUR.format(d), heure: HEURE.format(d) };
}

const ETAPE_MISSION: Record<string, string> = {
  PRISE_EN_CHARGE: "à collecter",
  COLLECTE_EFFECTUEE: "à déposer",
  DEPOT_VALIDE: "déposée",
  ANNULEE: "annulée",
};

/* Une mission prise reste a faire tant qu'elle n'est ni deposee ni annulee, meme en retard. */
export function depuisMission(m: MissionCollecteResponse): Engagement {
  return {
    cle: `mission-${m.id}`,
    type: "mission",
    ...jourEtHeure(m.dateHeure),
    titre: m.titre,
    lieu: m.lieuCollecte?.adresseFormatee ?? null,
    detail: ETAPE_MISSION[m.statut] ?? "",
    href: `/missions-collecte/${m.id}`,
    aVenir: m.statut === "PRISE_EN_CHARGE" || m.statut === "COLLECTE_EFFECTUEE",
  };
}

const FINS_EVENEMENT = ["TERMINE", "ANNULE"];

/* Une fois passe, ce qui compte est la presence, dite sans jugement. */
function presence(p: string): string | null {
  if (p === "PRESENT") return "présence notée";
  if (p === "ABSENT") return "absence";
  return null;
}

export function depuisParticipation(
  p: ParticipationEvenementResponse,
  evenements: Map<string, EvenementResponse>,
  maintenant: Date,
): Engagement | null {
  const evenement = evenements.get(p.evenementId);
  const debut = evenement?.dateHeureDebut ?? p.evenementDate;
  if (!debut) return null;
  const fin = new Date(evenement?.dateHeureFin ?? debut);
  const annule = evenement?.statut === "ANNULE";
  const aVenir = fin >= maintenant && !FINS_EVENEMENT.includes(evenement?.statut ?? "");
  return {
    cle: `evenement-${p.id}`,
    type: "evenement",
    ...jourEtHeure(debut),
    titre: evenement?.titre ?? p.evenementTitre ?? "Événement",
    lieu: evenement?.lieuAdresseFormatee ?? p.evenementLieu ?? null,
    detail: annule
      ? "annulé"
      : ((!aVenir && presence(p.presence)) || (p.role === "STAFF" ? "dans l'équipe" : "participation")),
    href: `/evenements/${p.evenementId}`,
    aVenir,
  };
}

export function depuisSession(i: InscriptionReconditionnementResponse, maintenant: Date): Engagement | null {
  if (!i.sessionDate) return null;
  const sessionAnnulee = i.sessionStatut === "ANNULEE";
  const annulee = i.statut === "ANNULEE" || sessionAnnulee;
  const aVenir = !annulee && new Date(i.sessionDate) >= maintenant;
  return {
    cle: `session-${i.id}`,
    type: "session",
    ...jourEtHeure(i.sessionDate),
    titre: i.sessionTitre ?? "Session de reconditionnement",
    lieu: i.sessionLieu,
    detail: sessionAnnulee ? "session annulée" : annulee ? "inscription annulée" : ((!aVenir && presence(i.presence)) || "inscription confirmée"),
    href: `/reconditionnement/${i.sessionId}`,
    aVenir,
  };
}

export interface SourcesEngagements {
  missions: MissionCollecteResponse[] | null;
  participations: ParticipationEvenementResponse[] | null;
  evenements: EvenementResponse[] | null;
  sessions: InscriptionReconditionnementResponse[] | null;
}

/* Tous les engagements hors distribution, dans l'ordre chronologique. */
export function engagements(sources: SourcesEngagements, maintenant: Date): Engagement[] {
  const evenements = new Map((sources.evenements ?? []).map((e) => [e.id, e]));
  return [
    ...(sources.missions ?? []).map(depuisMission),
    ...(sources.participations ?? []).map((p) => depuisParticipation(p, evenements, maintenant)),
    ...(sources.sessions ?? []).map((i) => depuisSession(i, maintenant)),
  ]
    .filter((e): e is Engagement => e !== null)
    .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`));
}

/* Mission encore libre, proposee aux benevoles. */
export function missionAPrendre(m: MissionCollecteResponse): Engagement {
  return { ...depuisMission(m), detail: "à prendre", aVenir: true };
}

/* Places d'equipe restantes, ou null si l'evenement ne cherche personne. */
export function placesEquipe(e: EvenementResponse): number | null {
  if (!e.aBesoiNStaff || e.statut !== "PUBLIE") return null;
  if (e.capaciteStaff == null) return Number.POSITIVE_INFINITY;
  return Math.max(0, e.capaciteStaff - e.nbStaff);
}

export function evenementCherchantEquipe(e: EvenementResponse): Engagement {
  const places = placesEquipe(e) ?? 0;
  return {
    cle: `evenement-${e.id}`,
    type: "evenement",
    ...jourEtHeure(e.dateHeureDebut),
    titre: e.titre,
    lieu: e.lieuAdresseFormatee,
    detail: Number.isFinite(places)
      ? `${places} place${places > 1 ? "s" : ""} dans l'équipe`
      : "cherche une équipe",
    href: `/evenements/${e.id}`,
    aVenir: true,
  };
}
