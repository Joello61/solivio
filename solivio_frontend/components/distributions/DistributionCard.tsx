import Link from "next/link";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
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
  EN_COURS:  "bg-primary",
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
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {distribution.titre}
        </h3>
        <DistributionStatutBadge statut={distribution.statut} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-4 shrink-0" />
          <span className="capitalize">{dateFormatee}</span>
        </div>
        {distribution.lieu?.adresseFormatee && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span>{distribution.lieu.adresseFormatee}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-4 shrink-0" />
          <span>
            {distribution.capaciteBeneficiaires} bénéficiaires
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
            "flex overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
            "group-hover:border-primary/40 group-hover:shadow-md transition-all duration-200",
          )}
        >
          <div className={cn("w-1.5 shrink-0", accentClass)} />
          <div className="flex flex-1 min-w-0 items-center gap-3 p-4 group-hover:bg-primary/5 transition-colors duration-200">
            <div className="flex-1 min-w-0">{infoContent}</div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
          </div>
        </div>
      </Link>
    );
  }

  const aDesActions = (STATUTS_ACTIFS as readonly string[]).includes(distribution.statut);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
        "hover:border-primary/40 hover:shadow-md transition-all duration-200",
      )}
    >
      <div className="flex flex-1">
        <div className={cn("w-1.5 shrink-0", accentClass)} />
        <div className="flex-1 min-w-0">
          <Link
            href={`/distributions/${distribution.id}`}
            className="block p-4 hover:bg-primary/5 transition-colors duration-200"
          >
            {infoContent}
          </Link>
          {aDesActions && (
            <div className="px-4 pb-4 border-t border-border/50 pt-3 bg-muted/50">
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
