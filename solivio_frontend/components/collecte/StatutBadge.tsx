import type { StatutMission } from "@/types/collecte";

const CONFIG: Record<StatutMission, { label: string; className: string }> = {
  DISPONIBLE: {
    label: "Disponible",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
  },
  PRISE_EN_CHARGE: {
    label: "Prise en charge",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  COLLECTE_EFFECTUEE: {
    label: "Collecte effectuee",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  DEPOT_VALIDE: {
    label: "Dépôt valide",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  ANNULEE: {
    label: "Annulée",
    className: "bg-red-50 text-red-700 border border-red-200",
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
