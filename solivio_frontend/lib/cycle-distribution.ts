import type { DistributionResponse, StatutDistribution } from "@/types/distribution";

/* Le cycle d'une distribution, lu comme un trajet plutot qu'un statut. */
export const ETAPES_CYCLE = ["Préparer", "Publier", "Remplir", "Jour J", "Bilan"];

const POSITION: Record<Exclude<StatutDistribution, "ANNULEE">, number> = {
  BROUILLON: 0,
  PUBLIEE: 2,
  EN_COURS: 3,
  // Toutes les etapes sont faites.
  TERMINEE: 5,
};

export function etapeCycle(statut: StatutDistribution): number | null {
  return statut === "ANNULEE" ? null : POSITION[statut];
}

export type ActionCycle =
  | "publier"
  | "ouvrir-jour-j"
  | "demarrer"
  | "terminer"
  | "modifier"
  | "dupliquer"
  | "annuler-demarrage"
  | "reactiver"
  | "supprimer"
  | "annuler";

/*
 * Une action principale par etape, les autres dans le menu "Plus". Les regles
 * reprennent celles du backend : demarrer le jour meme ou apres, modifier avant
 * le demarrage, supprimer un brouillon seulement, reactiver avant la date.
 */
export function actionsCycle(
  d: Pick<DistributionResponse, "statut" | "date">,
  aujourdhui: string,
): { principale: ActionCycle | null; secondaire: ActionCycle | null; menu: ActionCycle[] } {
  const menu: ActionCycle[] = [];
  let principale: ActionCycle | null = null;
  let secondaire: ActionCycle | null = null;
  switch (d.statut) {
    case "BROUILLON":
      principale = "publier";
      menu.push("modifier", "dupliquer", "supprimer", "annuler");
      break;
    case "PUBLIEE":
      if (d.date <= aujourdhui) principale = "demarrer";
      menu.push("modifier", "dupliquer", "annuler");
      break;
    case "EN_COURS":
      principale = "ouvrir-jour-j";
      secondaire = "terminer";
      menu.push("dupliquer", "annuler-demarrage", "annuler");
      break;
    case "TERMINEE":
      menu.push("dupliquer");
      break;
    case "ANNULEE":
      if (d.date >= aujourdhui) menu.push("reactiver");
      menu.push("dupliquer");
      break;
  }
  return { principale, secondaire, menu };
}

/* Distribution a la date decalee d'une semaine, pour preremplir une duplication. */
export function dateDupliquee(date: string, aujourdhui: string): string {
  const jour = new Date(`${date}T00:00:00Z`);
  const limite = new Date(`${aujourdhui}T00:00:00Z`);
  do {
    jour.setUTCDate(jour.getUTCDate() + 7);
  } while (jour < limite);
  return jour.toISOString().slice(0, 10);
}

const JOUR_MOIS = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Titre propose a partir de la date : "Distribution du jeudi 22 octobre". */
export function titrePropose(date: string): string {
  return `Distribution du ${JOUR_MOIS.format(new Date(`${date}T00:00:00Z`))}`;
}

export type SectionPlanning = "a-venir" | "brouillons" | "passees" | "annulees";

/* Rang d'une distribution dans le planning : ce qui se passe, puis ce qui vient. */
export function sectionPlanning(d: Pick<DistributionResponse, "statut" | "date">, aujourdhui: string): SectionPlanning {
  if (d.statut === "BROUILLON") return "brouillons";
  if (d.statut === "ANNULEE") return "annulees";
  if (d.statut === "TERMINEE" || (d.statut === "PUBLIEE" && d.date < aujourdhui)) return "passees";
  return "a-venir";
}

export type TonTache = "action" | "attention" | "info";

export interface Tache {
  cle: string;
  titre: string;
  detail: string;
  href: string;
  ton: TonTache;
}

const FENETRE_REMPLISSAGE = 7;
const FENETRE_BENEVOLES = 14;
const SEUIL_PEU_REMPLIE = 0.5;

function joursEntre(debut: string, fin: string): number {
  return Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${debut}T00:00:00Z`)) / 86_400_000);
}

const COURTE = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const libelleDate = (date: string) => {
  const texte = COURTE.format(new Date(`${date}T00:00:00Z`));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
};

/*
 * Ce qui demande une action du coordinateur, du plus pressant au plus informatif.
 * Les effectifs viennent du remplissage, visible des seuls gestionnaires.
 */
export function tachesDistributions(distributions: DistributionResponse[], aujourdhui: string): Tache[] {
  const taches: Tache[] = [];
  const tries = [...distributions].sort((a, b) => a.date.localeCompare(b.date));
  for (const d of tries) {
    const href = `/distributions/${d.id}`;
    const quand = libelleDate(d.date);
    const ecart = joursEntre(aujourdhui, d.date);
    if (d.statut === "EN_COURS" && d.date < aujourdhui) {
      taches.push({ cle: `cloture-${d.id}`, titre: "Clore la distribution", detail: `${quand} : restée ouverte, le bilan attend la clôture.`, href, ton: "action" });
    }
    if (d.statut === "BROUILLON" && ecart >= 0) {
      taches.push({ cle: `brouillon-${d.id}`, titre: "Publier le brouillon", detail: `${quand} : personne ne peut encore s'inscrire.`, href, ton: "action" });
    }
    if (d.statut !== "PUBLIEE" || ecart < 0) continue;
    const r = d.remplissage;
    const inscrits = r.beneficiairesConfirmes ?? 0;
    if (ecart <= FENETRE_REMPLISSAGE && inscrits < d.capaciteBeneficiaires * SEUIL_PEU_REMPLIE) {
      taches.push({ cle: `peu-${d.id}`, titre: "Peu d'inscrits", detail: `${quand} : ${inscrits} sur ${d.capaciteBeneficiaires} places.`, href, ton: "attention" });
    }
    const manquent = r.placesRestantesBenevoles ?? 0;
    if (ecart <= FENETRE_BENEVOLES && manquent > 0) {
      taches.push({
        cle: `benevoles-${d.id}`,
        titre: `${manquent} bénévole${manquent > 1 ? "s" : ""} manque${manquent > 1 ? "nt" : ""}`,
        detail: `${quand} : ${r.benevolesConfirmes ?? 0} sur ${d.capaciteBenevoles} dans l'équipe.`,
        href,
        ton: "attention",
      });
    }
    const attente = r.beneficiairesEnAttente ?? 0;
    if (attente > 0) {
      taches.push({
        cle: `attente-${d.id}`,
        titre: `${attente} en liste d'attente`,
        detail: `${quand} : une place libérée leur revient automatiquement.`,
        href,
        ton: "info",
      });
    }
  }
  const ordre: Record<TonTache, number> = { action: 0, attention: 1, info: 2 };
  return taches.sort((a, b) => ordre[a.ton] - ordre[b.ton]);
}
