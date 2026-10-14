import { MapPin } from "lucide-react";
import type { DistributionPubliqueResponse } from "@/types/distribution";

const JOUR = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });

const heure = (h: string) => h.slice(0, 5);

// L'adresse formatee reprend souvent le nom du lieu : ne pas l'ecrire deux fois.
function lieu(d: DistributionPubliqueResponse): string {
  if (!d.lieuNom) return d.lieuAdresse ?? "";
  if (!d.lieuAdresse || d.lieuAdresse.includes(d.lieuNom)) return d.lieuAdresse ?? d.lieuNom;
  return `${d.lieuNom}, ${d.lieuAdresse}`;
}

/* Liste des prochaines dates de la page publique ; null quand le backend n'a pas repondu. */
export function ProchainesDistributions({ distributions }: { distributions: DistributionPubliqueResponse[] | null }) {
  if (distributions === null) {
    return (
      <p className="rounded-xl border border-border bg-card px-5 py-4 text-base text-muted-foreground">
        Les prochaines dates ne peuvent pas être affichées pour le moment. Connectez-vous pour les retrouver.
      </p>
    );
  }
  if (distributions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-5 py-4 text-base text-muted-foreground">
        Aucune distribution n&apos;est annoncée pour le moment. Les prochaines dates seront publiées ici.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {distributions.map((d, i) => {
        const jour = new Date(`${d.date}T00:00:00Z`);
        return (
          <li key={`${d.date}-${i}`} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-baseline gap-3 sm:w-64 sm:shrink-0">
              <span className="font-display text-xl font-bold capitalize text-foreground">{JOUR.format(jour)}</span>
              <span className="text-base text-foreground">{DATE.format(jour)}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {d.heureDebut && d.heureFin && (
                <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                  {heure(d.heureDebut)} - {heure(d.heureFin)}
                </span>
              )}
              {(d.lieuNom || d.lieuAdresse) && (
                <span className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{lieu(d)}</span>
                </span>
              )}
            </div>
            <span className={d.complet ? "text-sm font-semibold text-muted-foreground" : "text-sm font-semibold text-success"}>
              {d.complet ? "Complet, liste d'attente possible" : "Places disponibles"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
