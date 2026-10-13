import type { StatutEvenement } from "@/types/evenement";

const CONFIG: Record<StatutEvenement, { label: string; className: string }> = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-muted text-muted-foreground border border-border",
  },
  PUBLIE: {
    label: "Publié",
    className: "bg-primary/10 text-primary border border-primary/25",
  },
  EN_COURS: {
    label: "En cours",
    className: "bg-info/10 text-info border border-info/30",
  },
  TERMINE: {
    label: "Terminé",
    className: "bg-success/10 text-success border border-success/30",
  },
  ANNULE: {
    label: "Annulé",
    className: "bg-destructive/10 text-destructive border border-destructive/30",
  },
};

interface Props {
  statut: StatutEvenement;
}

export function StatutBadge({ statut }: Props) {
  const { label, className } = CONFIG[statut];
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
