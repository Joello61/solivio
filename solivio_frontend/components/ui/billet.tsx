import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BilletProps {
  /* Date ISO (aaaa-mm-jj) du rendez-vous. */
  date: string;
  horaire: string;
  lieu: ReactNode;
  statut?: ReactNode;
  note?: ReactNode;
  /* Actions en pied de billet (itineraire, desinscription). */
  actions?: ReactNode;
  className?: string;
}

const JOUR = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });
const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const COMPLET = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/*
 * Une inscription presentee comme un billet : s'inscrire doit etre aussi neutre
 * que reserver un creneau (docs/parcours_utilisateurs.md, section 2).
 */
export function Billet({ date, horaire, lieu, statut, note, actions, className }: BilletProps) {
  const jour = new Date(`${date}T00:00:00Z`);
  return (
    <article
      aria-label={`Rendez-vous du ${COMPLET.format(jour)}, ${horaire}`}
      className={cn("overflow-hidden rounded-2xl bg-brand text-on-brand", className)}
    >
      <div className="flex">
        <div
          aria-hidden="true"
          className="flex min-w-20 flex-col items-center justify-center gap-0.5 border-r-2 border-dashed border-on-brand/35 px-4 py-5"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-on-brand/80">
            {JOUR.format(jour).replace(".", "")}
          </span>
          <span className="font-display text-4xl leading-none font-extrabold tabular-nums">
            {jour.getUTCDate()}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-on-brand/80">
            {MOIS.format(jour).replace(".", "")}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-5">
          <p className="font-display text-2xl leading-tight font-bold tabular-nums">{horaire}</p>
          <div className="text-base leading-snug text-on-brand/85">{lieu}</div>
          {(statut || note) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              {statut}
              {note && <span className="text-on-brand/80">{note}</span>}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex divide-x divide-on-brand/20 border-t border-on-brand/20 [&>*]:flex-1">
          {actions}
        </div>
      )}
    </article>
  );
}

/* Bouton ou lien de pied de billet. */
export const actionBillet =
  "flex min-h-12 items-center justify-center gap-2 px-3 text-base font-semibold text-on-brand hover:bg-on-brand/10 focus-visible:outline-on-brand";
