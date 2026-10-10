import { cn } from "@/lib/utils";
import type { StatutSession } from "@/types/reconditionnement";

const STATUT_CONFIG: Record<StatutSession, { label: string; className: string }> = {
  BROUILLON: {
    label: "Brouillon",
    className:
      "bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  },
  PUBLIEE: {
    label: "Publiée",
    className: "bg-primary text-primary-foreground",
  },
  EN_COURS: {
    label: "En cours",
    className:
      "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800/40",
  },
  TERMINEE: {
    label: "Terminée",
    className:
      "bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  },
  ANNULEE: {
    label: "Annulée",
    className:
      "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40",
  },
};

interface Props {
  statut: StatutSession;
}

export function StatutBadge({ statut }: Props) {
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
