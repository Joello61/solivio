import { Badge } from "@/components/ui/badge";
import type { StatutDistribution } from "@/types/distribution";

const STATUT_CONFIG: Record<StatutDistribution, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  BROUILLON: { label: "Brouillon", variant: "outline" },
  PUBLIEE: { label: "Publiee", variant: "default" },
  EN_COURS: { label: "En cours", variant: "secondary" },
  TERMINEE: { label: "Terminee", variant: "outline" },
  ANNULEE: { label: "Annulee", variant: "destructive" },
};

interface Props {
  statut: StatutDistribution;
}

export function DistributionStatutBadge({ statut }: Props) {
  const config = STATUT_CONFIG[statut];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
