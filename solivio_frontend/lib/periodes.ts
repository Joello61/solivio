export interface Periode {
  debut: string;
  fin: string;
}

export const PERIODES = [
  { cle: "mois", libelle: "Ce mois-ci" },
  { cle: "mois-precedent", libelle: "Mois précédent" },
  { cle: "trimestre", libelle: "3 derniers mois" },
  { cle: "annee", libelle: "Cette année" },
] as const;

export type ClePeriode = (typeof PERIODES)[number]["cle"];

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function periodePredefinie(cle: ClePeriode, aujourdhui: Date): Periode {
  const a = aujourdhui.getFullYear();
  const m = aujourdhui.getMonth();
  switch (cle) {
    case "mois-precedent":
      return { debut: iso(new Date(a, m - 1, 1)), fin: iso(new Date(a, m, 0)) };
    case "trimestre":
      return { debut: iso(new Date(a, m - 2, 1)), fin: iso(new Date(a, m + 1, 0)) };
    case "annee":
      return { debut: iso(new Date(a, 0, 1)), fin: iso(new Date(a, 11, 31)) };
    default:
      return { debut: iso(new Date(a, m, 1)), fin: iso(new Date(a, m + 1, 0)) };
  }
}

/** Periode demandee dans l'URL ; mois courant si elle est absente ou invalide. */
export function lirePeriode(debut: string | undefined, fin: string | undefined, aujourdhui: Date): Periode {
  if (debut && fin && DATE_ISO.test(debut) && DATE_ISO.test(fin) && debut <= fin) {
    return { debut, fin };
  }
  return periodePredefinie("mois", aujourdhui);
}
