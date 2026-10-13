export interface CreneauGenere {
  heureDebut: string;
  heureFin: string;
  capacite: number;
}

export const DUREES_CRENEAU = [10, 15, 20, 30] as const;

function enMinutes(heure: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(heure);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function enHeure(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Decoupe la plage [debut, fin] en creneaux consecutifs de la duree donnee. Un dernier
 * creneau incomplet est ignore : il ne tiendrait pas dans la plage annoncee.
 */
export function genererCreneaux(debut: string, fin: string, duree: number, capacite: number): CreneauGenere[] {
  const a = enMinutes(debut);
  const b = enMinutes(fin);
  if (a === null || b === null || b <= a || duree <= 0 || capacite <= 0) return [];
  const creneaux: CreneauGenere[] = [];
  for (let t = a; t + duree <= b; t += duree) {
    creneaux.push({ heureDebut: enHeure(t), heureFin: enHeure(t + duree), capacite });
  }
  return creneaux;
}
