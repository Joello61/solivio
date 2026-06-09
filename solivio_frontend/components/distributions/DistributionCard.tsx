import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { DistributionStatutBadge } from "./DistributionStatutBadge";
import { DistributionActions } from "./DistributionActions";
import { cn } from "@/lib/utils";
import type { DistributionResponse } from "@/types/distribution";

interface Props {
  distribution: DistributionResponse;
  estGestionnaire?: boolean;
}

const STATUTS_ACTIFS = ["BROUILLON", "PUBLIEE", "EN_COURS"] as const;

const STATUT_ACCENT: Record<string, string> = {
  BROUILLON: "bg-muted-foreground/30",
  PUBLIEE:   "bg-primary",
  EN_COURS:  "bg-emerald-500",
  TERMINEE:  "bg-muted-foreground/20",
  ANNULEE:   "bg-destructive",
};

export function DistributionCard({ distribution, estGestionnaire }: Props) {
  const dateFormatee = new Date(distribution.date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const infoContent = (
    <>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h3 className="text-sm font-semibold text-foreground leading-snug">
          {distribution.titre}
        </h3>
        <DistributionStatutBadge statut={distribution.statut} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          <span className="capitalize">{dateFormatee}</span>
        </div>
        {distribution.lieu && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span>{distribution.lieu}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5 shrink-0" />
          <span>
            {distribution.capaciteBeneficiaires} beneficiaires
            {distribution.capaciteBenevoles ? ` - ${distribution.capaciteBenevoles} benevoles` : ""}
          </span>
        </div>
      </div>
    </>
  );

  const accentClass = STATUT_ACCENT[distribution.statut] ?? "bg-muted-foreground/20";

  if (!estGestionnaire) {
    return (
      <Link href={`/distributions/${distribution.id}`} className="group block">
        <div
          className={cn(
            "flex overflow-hidden rounded-xl border border-border bg-card",
            "group-hover:border-primary/25 group-hover:shadow-md transition-all duration-200",
          )}
        >
          <div className={cn("w-1 shrink-0", accentClass)} />
          <div className="flex-1 min-w-0 p-4 group-hover:bg-muted/25 transition-colors duration-200">
            {infoContent}
          </div>
        </div>
      </Link>
    );
  }

  const aDesActions = (STATUTS_ACTIFS as readonly string[]).includes(distribution.statut);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        "hover:border-primary/25 hover:shadow-md transition-all duration-200",
      )}
    >
      <div className="flex flex-1">
        <div className={cn("w-1 shrink-0", accentClass)} />
        <div className="flex-1 min-w-0">
          <Link
            href={`/distributions/${distribution.id}`}
            className="block p-4 hover:bg-muted/25 transition-colors duration-200"
          >
            {infoContent}
          </Link>
          {aDesActions && (
            <div className="px-4 pb-4 border-t border-border/50 pt-3">
              <DistributionActions
                distributionId={distribution.id}
                statut={distribution.statut}
                distributionDate={distribution.date}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
