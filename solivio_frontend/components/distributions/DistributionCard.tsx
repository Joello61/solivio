import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DistributionStatutBadge } from "./DistributionStatutBadge";
import type { DistributionResponse } from "@/types/distribution";

interface Props {
  distribution: DistributionResponse;
}

export function DistributionCard({ distribution }: Props) {
  const dateFormatee = new Date(distribution.date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link href={`/distributions/${distribution.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {distribution.titre}
          </CardTitle>
          <DistributionStatutBadge statut={distribution.statut} />
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            <span>{dateFormatee}</span>
          </div>
          {distribution.lieu && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span>{distribution.lieu}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0" />
            <span>
              {distribution.capaciteBeneficiaires} beneficiaires
              {distribution.capaciteBenevoles ? ` - ${distribution.capaciteBenevoles} benevoles` : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
