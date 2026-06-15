import type { StatutEvenement } from "@/types/evenement";

const CONFIG: Record<StatutEvenement, { label: string; className: string }> = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-slate-50 text-slate-600 border border-slate-200",
  },
  PUBLIE: {
    label: "Publie",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
  },
  EN_COURS: {
    label: "En cours",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  TERMINE: {
    label: "Termine",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  ANNULE: {
    label: "Annule",
    className: "bg-red-50 text-red-700 border border-red-200",
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
