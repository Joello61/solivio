import { cn } from "@/lib/utils";

interface JaugeProps {
  /* Places occupees (inscriptions confirmees). */
  valeur: number;
  capacite: number;
  /* Personnes en liste d'attente, dessinees en hachures au bout de la jauge. */
  attente?: number;
  libelle: string;
  /* Texte de droite, par exemple "32 places" ou "5 manquent". */
  detail?: string;
  detailTon?: "neutre" | "attente";
  ton?: "pin" | "encre";
  taille?: "sm" | "md";
  /* Masque la ligne de texte quand le contexte l'affiche deja. */
  sansTexte?: boolean;
  className?: string;
}

function pourcentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}

/* Remplissage d'une capacite : confirmes, liste d'attente, places restantes. */
export function Jauge({
  valeur,
  capacite,
  attente = 0,
  libelle,
  detail,
  detailTon = "neutre",
  ton = "pin",
  taille = "md",
  sansTexte = false,
  className,
}: JaugeProps) {
  const total = Math.max(capacite, valeur + attente);
  const plein = pourcentage(valeur, total);
  const enAttente = pourcentage(attente, total);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {!sansTexte && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-semibold text-foreground tabular-nums">{libelle}</span>
          {detail && (
            <span
              className={cn(
                "tabular-nums",
                detailTon === "attente" ? "text-warning" : "text-muted-foreground",
              )}
            >
              {detail}
            </span>
          )}
        </div>
      )}
      <div
        role="meter"
        aria-label={libelle}
        aria-valuenow={valeur}
        aria-valuemin={0}
        aria-valuemax={capacite}
        aria-valuetext={detail ? `${libelle}, ${detail}` : libelle}
        className={cn(
          "flex w-full overflow-hidden rounded-full bg-border",
          taille === "sm" ? "h-1.5" : "h-2.5",
        )}
      >
        <div
          className={cn("h-full", ton === "pin" ? "bg-primary" : "bg-foreground")}
          style={{ width: `${plein}%` }}
        />
        {enAttente > 0 && (
          <div
            className="h-full bg-[repeating-linear-gradient(135deg,var(--warning)_0_3px,transparent_3px_6px)]"
            style={{ width: `${enAttente}%` }}
          />
        )}
      </div>
    </div>
  );
}
