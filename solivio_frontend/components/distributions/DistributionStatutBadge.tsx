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
    label: "Publiée",
    className: "bg-primary text-primary-foreground",
  },
  EN_COURS: {
    label: "En cours",
    className:
      "bg-primary/10 text-primary border border-primary/25",
  },
  TERMINEE: {
    label: "Terminée",
    className: "bg-muted text-muted-foreground border border-border",
  },
  ANNULEE: {
    label: "Annulée",
    className:
      "bg-destructive/10 text-destructive border border-destructive/30",
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
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
