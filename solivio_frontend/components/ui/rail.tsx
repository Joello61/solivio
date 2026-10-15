import { cn } from "@/lib/utils";

interface RailProps {
  etapes: string[];
  /* Index de l'etape en cours ; les precedentes sont faites. */
  courante: number;
  libelle: string;
  className?: string;
}

/*
 * Cycle de vie rendu comme un trajet : le statut est une position, pas un badge.
 * L'etape en cours prend le jaune.
 */
export function Rail({ etapes, courante, libelle, className }: RailProps) {
  return (
    <ol
      aria-label={libelle}
      className={cn("grid gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${etapes.length}, minmax(0, 1fr))` }}
    >
      {etapes.map((etape, index) => {
        const faite = index < courante;
        const enCours = index === courante;
        return (
          <li
            key={etape}
            aria-current={enCours ? "step" : undefined}
            className="flex min-w-0 flex-col gap-2"
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 rounded-full",
                faite && "bg-primary",
                enCours && "bg-accent",
                !faite && !enCours && "bg-border",
              )}
            />
            <span
              className={cn(
                "truncate text-sm",
                faite && "font-semibold text-primary",
                enCours && "font-bold text-foreground",
                !faite && !enCours && "text-muted-foreground",
              )}
            >
              {etape}
              {faite && <span className="sr-only"> (faite)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
