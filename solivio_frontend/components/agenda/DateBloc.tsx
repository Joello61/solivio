import { cn } from "@/lib/utils";

const JOUR = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });
const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

interface Props {
  date: string;
  /* Mois sous le quantieme, quand la liste couvre plusieurs mois (historique). */
  avecMois?: boolean;
  className?: string;
}

/* Jour de la semaine et quantieme, en tete d'une ligne d'agenda. */
export function DateBloc({ date, avecMois = false, className }: Props) {
  const jour = new Date(`${date}T00:00:00Z`);
  return (
    <div aria-hidden="true" className={cn("flex w-11 flex-col items-center gap-0.5", className)}>
      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {JOUR.format(jour).replace(".", "")}
      </span>
      <span className="font-display text-2xl leading-none font-extrabold tabular-nums text-foreground">
        {jour.getUTCDate()}
      </span>
      {avecMois && (
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {MOIS.format(jour).replace(".", "")}
        </span>
      )}
    </div>
  );
}
