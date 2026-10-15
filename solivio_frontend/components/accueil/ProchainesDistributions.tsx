import { MapPin } from "lucide-react";
import type { DistributionPubliqueResponse } from "@/types/distribution";

const JOUR = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });
const NUMERO = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "UTC" });
const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const COMPLETE = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const heure = (h: string) => h.slice(0, 5);
const court = (texte: string) => texte.replace(".", "").toUpperCase();

// L'adresse formatee reprend souvent le nom du lieu : ne pas l'ecrire deux fois.
export function lieuPublic(d: DistributionPubliqueResponse): string {
  if (!d.lieuNom) return d.lieuAdresse ?? "";
  if (!d.lieuAdresse || d.lieuAdresse.includes(d.lieuNom)) return d.lieuAdresse ?? d.lieuNom;
  return `${d.lieuNom}, ${d.lieuAdresse}`;
}

export function datePublique(d: DistributionPubliqueResponse) {
  const jour = new Date(`${d.date}T00:00:00Z`);
  return { jour: court(JOUR.format(jour)), numero: NUMERO.format(jour), mois: court(MOIS.format(jour)), complete: COMPLETE.format(jour) };
}

/*
 * Prochaines dates de la page publique, en cartes posees sur le bandeau bleu ;
 * null quand le backend n'a pas repondu.
 */
export function ProchainesDistributions({ distributions }: { distributions: DistributionPubliqueResponse[] | null }) {
  if (distributions === null || distributions.length === 0) {
    return (
      <p className="rounded-2xl bg-card px-5 py-4 text-base text-card-foreground">
        {distributions === null
          ? "Les prochaines dates ne peuvent pas être affichées pour le moment. Connectez-vous pour les retrouver."
          : "Aucune distribution n'est annoncée pour le moment. Les prochaines dates seront publiées ici."}
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {distributions.map((d, i) => {
        const { jour, numero, mois, complete } = datePublique(d);
        return (
          <li key={`${d.date}-${i}`} className="flex gap-4 rounded-2xl bg-card p-4 text-card-foreground">
            <span className="sr-only">{complete}</span>
            <div aria-hidden="true" className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-secondary py-2 text-secondary-foreground">
              <span className="font-mono text-xs tracking-wider">{jour}</span>
              <span className="font-display text-2xl leading-none font-extrabold">{numero}</span>
              <span className="font-mono text-xs tracking-wider">{mois}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {d.heureDebut && d.heureFin && (
                <span className="font-display text-xl font-extrabold tabular-nums">
                  {heure(d.heureDebut)} - {heure(d.heureFin)}
                </span>
              )}
              {(d.lieuNom || d.lieuAdresse) && (
                <span className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{lieuPublic(d)}</span>
                </span>
              )}
              <span className={d.complet ? "text-sm font-semibold text-warning" : "text-sm font-semibold text-info"}>
                {d.complet ? "Complet, liste d'attente possible" : "Places disponibles"}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
