import { dateLongue, horaire } from "@/lib/agenda";
import { jourEtHeure } from "@/lib/engagements";
import type {
  EvenementResponse,
  ModeInscription,
  PublicCible,
  RoleParticipation,
  StatutEvenement,
  TypeEvenement,
} from "@/types/evenement";
import type { StatutSession } from "@/types/reconditionnement";
import type { StatutMission } from "@/types/collecte";

type StatutActivite = StatutEvenement | StatutSession;

/* Le cycle d'un evenement ou d'une session, sur le meme rail qu'une distribution. */
export const ETAPES_ACTIVITE = ["Préparer", "Publier", "Remplir", "Jour J", "Terminé"];

const POSITION: Record<string, number> = {
  BROUILLON: 0,
  PUBLIE: 2,
  PUBLIEE: 2,
  EN_COURS: 3,
  // Toutes les etapes sont faites.
  TERMINE: 5,
  TERMINEE: 5,
};

export function etapeActivite(statut: StatutActivite): number | null {
  return POSITION[statut] ?? null;
}

export type SectionActivite = "a-venir" | "brouillons" | "passees" | "annulees";

export const SECTIONS_ACTIVITE: { valeur: SectionActivite; libelle: string }[] = [
  { valeur: "a-venir", libelle: "À venir" },
  { valeur: "brouillons", libelle: "Brouillons" },
  { valeur: "passees", libelle: "Passées" },
  { valeur: "annulees", libelle: "Annulées" },
];

/* Rang d'une activite dans la liste de gestion : terminee ou finie, elle est passee. */
export function sectionActivite(a: { statut: StatutActivite; dateHeureFin: string }, maintenant: Date): SectionActivite {
  if (a.statut === "BROUILLON") return "brouillons";
  if (a.statut === "ANNULE" || a.statut === "ANNULEE") return "annulees";
  if (a.statut === "TERMINE" || a.statut === "TERMINEE" || new Date(a.dateHeureFin) < maintenant) return "passees";
  return "a-venir";
}

export type SectionMission = "a-pourvoir" | "en-cours" | "terminees" | "annulees";

export const SECTIONS_MISSION: { valeur: SectionMission; libelle: string }[] = [
  { valeur: "a-pourvoir", libelle: "À pourvoir" },
  { valeur: "en-cours", libelle: "En cours" },
  { valeur: "terminees", libelle: "Déposées" },
  { valeur: "annulees", libelle: "Annulées" },
];

const SECTION_MISSION: Record<StatutMission, SectionMission> = {
  DISPONIBLE: "a-pourvoir",
  PRISE_EN_CHARGE: "en-cours",
  COLLECTE_EFFECTUEE: "en-cours",
  DEPOT_VALIDE: "terminees",
  ANNULEE: "annulees",
};

export function sectionMission(statut: StatutMission): SectionMission {
  return SECTION_MISSION[statut];
}

/* Jour et plage horaire d'une activite, dans le fuseau de l'association. */
export function quandActivite(debut: string, fin: string): { date: string; plage: string } {
  const d = jourEtHeure(debut);
  const f = jourEtHeure(fin);
  if (d.date === f.date) return { date: d.date, plage: horaire(d.heure, f.heure) ?? d.heure };
  return { date: d.date, plage: `${d.heure}, jusqu'au ${dateLongue(f.date)} ${f.heure}` };
}

/* Tri des listes : le plus proche d'abord a venir, le plus recent d'abord ensuite. */
export function trierActivites<T>(elements: T[], section: string, debutDe: (e: T) => string): T[] {
  const sens = section === "a-venir" || section === "brouillons" || section === "a-pourvoir" || section === "en-cours" ? 1 : -1;
  return [...elements].sort((a, b) => sens * debutDe(a).localeCompare(debutDe(b)));
}

export interface PlaceEvenement {
  role: RoleParticipation;
  complet: boolean;
}

/*
 * Roles qu'un membre peut prendre sur un evenement, avec les regles du backend :
 * staff pour les benevoles si l'evenement en cherche, participant selon le
 * public vise. Sans inscription, il n'y a pas de liste a rejoindre.
 */
export function placesOuvertes(e: EvenementResponse, roles: string[]): PlaceEvenement[] {
  if ((e.statut !== "PUBLIE" && e.statut !== "EN_COURS") || e.modeInscription === "SANS_INSCRIPTION") return [];
  const places: PlaceEvenement[] = [];
  if (e.aBesoiNStaff && roles.includes("benevole")) {
    places.push({ role: "STAFF", complet: e.capaciteStaff != null && e.nbStaff >= e.capaciteStaff });
  }
  const publicVise =
    e.publicParticipants === "TOUS" ||
    (e.publicParticipants === "BENEVOLES" && roles.includes("benevole")) ||
    (e.publicParticipants === "BENEFICIAIRES" && roles.includes("beneficiaire"));
  if (e.ouvertParticipants && publicVise) {
    places.push({ role: "PARTICIPANT", complet: e.capaciteParticipants != null && e.nbParticipants >= e.capaciteParticipants });
  }
  return places;
}

export const MODE_INSCRIPTION: Record<ModeInscription, { libelle: string; consequence: string }> = {
  OBLIGATOIRE: { libelle: "Sur inscription", consequence: "Chacun s'inscrit avant de venir, la présence est pointée sur place." },
  LIBRE: { libelle: "Inscription conseillée", consequence: "S'inscrire aide à prévoir, mais personne n'est pointé." },
  SANS_INSCRIPTION: { libelle: "Sans inscription", consequence: "On vient librement : pas de liste, pas de pointage." },
};

export const PUBLIC_CIBLE: Record<PublicCible, string> = {
  BENEVOLES: "Bénévoles",
  BENEFICIAIRES: "Bénéficiaires",
  TOUS: "Tout le monde",
};

export const TYPE_EVENEMENT: Record<TypeEvenement, string> = {
  STAND: "Stand",
  FETE: "Fête",
  AUTRE: "Événement",
};
