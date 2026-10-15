import type { DistributionResponse, LieuResponse, TypeInscription } from "@/types/distribution";

const heure = (h: string) => h.slice(0, 5);

/** "17:30 - 19:30", ou null sans horaire connu. */
export function horaire(debut: string | null, fin: string | null): string | null {
  if (!debut) return null;
  return fin ? `${heure(debut)} - ${heure(fin)}` : heure(debut);
}

/* Plage d'une distribution : du premier creneau a la fin du dernier. */
export function plageDistribution(d: Pick<DistributionResponse, "creneaux">): string | null {
  if (d.creneaux.length === 0) return null;
  const debut = d.creneaux.map((c) => c.heureDebut).sort()[0];
  const fin = d.creneaux.map((c) => c.heureFin).sort().at(-1) ?? null;
  return horaire(debut, fin);
}

/* Le nom du lieu parle plus que l'adresse ; l'adresse sert a defaut. */
export function lieuCourt(lieu: Pick<LieuResponse, "nom" | "adresseFormatee"> | null): string | null {
  return lieu?.nom || lieu?.adresseFormatee || null;
}

export interface Places {
  restantes: number;
  capacite: number;
}

/* Places restantes pour le type d'inscription du membre, ou null sans limite. */
export function placesPour(d: DistributionResponse, type: TypeInscription): Places | null {
  if (type === "BENEVOLE") {
    const restantes = d.remplissage.placesRestantesBenevoles;
    if (d.capaciteBenevoles == null || restantes == null) return null;
    return { restantes, capacite: d.capaciteBenevoles };
  }
  return { restantes: d.remplissage.placesRestantesBeneficiaires, capacite: d.capaciteBeneficiaires };
}

export function libellePlaces(restantes: number): string {
  if (restantes <= 0) return "Complet, liste d'attente possible";
  return restantes === 1 ? "1 place restante" : `${restantes} places restantes`;
}

const UN_JOUR = 86_400_000;

function versDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function versIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Lundi (aaaa-mm-jj) de la semaine de cette date. */
export function lundiDe(iso: string): string {
  const date = versDate(iso);
  const decalage = (date.getUTCDay() + 6) % 7;
  return versIso(new Date(date.getTime() - decalage * UN_JOUR));
}

const JOUR_MOIS = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });

export function libelleSemaine(lundi: string, aujourdhui: string): string {
  const courante = lundiDe(aujourdhui);
  if (lundi === courante) return "Cette semaine";
  if (versDate(lundi).getTime() - versDate(courante).getTime() === 7 * UN_JOUR) return "Semaine prochaine";
  return `Semaine du ${JOUR_MOIS.format(versDate(lundi))}`;
}

export interface Semaine<T> {
  lundi: string;
  libelle: string;
  elements: T[];
}

/* Regroupe des elements dates par semaine, dans l'ordre chronologique. */
export function grouperParSemaine<T>(elements: T[], dateDe: (e: T) => string, aujourdhui: string): Semaine<T>[] {
  const tries = [...elements].sort((a, b) => dateDe(a).localeCompare(dateDe(b)));
  const semaines: Semaine<T>[] = [];
  for (const element of tries) {
    const lundi = lundiDe(dateDe(element));
    let semaine = semaines.at(-1);
    if (semaine?.lundi !== lundi) {
      semaine = { lundi, libelle: libelleSemaine(lundi, aujourdhui), elements: [] };
      semaines.push(semaine);
    }
    semaine.elements.push(element);
  }
  return semaines;
}

const JOUR_LONG = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const JOUR_SEUL = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "UTC" });

/** "jeudi 22 octobre". */
export function dateLongue(iso: string): string {
  return JOUR_LONG.format(versDate(iso));
}

/** "aujourd'hui", "demain", "jeudi" dans la semaine, sinon "jeudi 22 octobre". */
export function quand(iso: string, aujourdhui: string): string {
  const ecart = Math.round((versDate(iso).getTime() - versDate(aujourdhui).getTime()) / UN_JOUR);
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  if (ecart > 1 && ecart < 7) return JOUR_SEUL.format(versDate(iso));
  return dateLongue(iso);
}
