import { cn } from "@/lib/utils";
import type { StatutDistribution } from "@/types/distribution";

const STATUT_CONFIG: Record<
  StatutDistribution,
  { label: string; className: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-muted text-muted-foreground border border-border",
  },
  PUBLIEE: {
    label: "Publiee",
    className: "bg-primary/10 text-primary border border-primary/20",
  },
  EN_COURS: {
    label: "En cours",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40",
  },
  TERMINEE: {
    label: "Terminee",
    className: "bg-muted text-muted-foreground border border-border",
  },
  ANNULEE: {
    label: "Annulee",
    className:
      "bg-destructive/10 text-destructive border border-destructive/20",
  },
};

interface Props {
  statut: StatutDistribution;
}

export function DistributionStatutBadge({ statut }: Props) {
  const config = STATUT_CONFIG[statut];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
