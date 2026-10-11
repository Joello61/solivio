import type { StatutMission } from "@/types/collecte";

const CONFIG: Record<StatutMission, { label: string; className: string }> = {
  DISPONIBLE: {
    label: "Disponible",
    className: "bg-primary/10 text-primary border border-primary/25",
  },
  PRISE_EN_CHARGE: {
    label: "Prise en charge",
    className: "bg-warning/10 text-warning border border-warning/30",
  },
  COLLECTE_EFFECTUEE: {
    label: "Collecte effectuée",
    className: "bg-info/10 text-info border border-info/30",
  },
  DEPOT_VALIDE: {
    label: "Dépôt validé",
    className: "bg-success/10 text-success border border-success/30",
  },
  ANNULEE: {
    label: "Annulée",
    className: "bg-destructive/10 text-destructive border border-destructive/30",
  },
};

interface Props {
  statut: StatutMission;
}

export function StatutBadge({ statut }: Props) {
  const { label, className } = CONFIG[statut];
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
