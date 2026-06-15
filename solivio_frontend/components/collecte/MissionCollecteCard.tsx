import Link from "next/link";
import { Calendar, MapPin, Truck, User } from "lucide-react";
import { StatutBadge } from "./StatutBadge";
import type { MissionCollecteResponse } from "@/types/collecte";

interface Props {
  mission: MissionCollecteResponse;
}

export function MissionCollecteCard({ mission }: Props) {
  return (
    <Link
      href={`/missions-collecte/${mission.id}`}
      className="block rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-150 overflow-hidden"
    >
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground line-clamp-2">{mission.titre}</h2>
          <StatutBadge statut={mission.statut} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            <span>
              {new Date(mission.dateHeure).toLocaleString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {mission.lieuCollecte?.adresseFormatee && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">Collecte : {mission.lieuCollecte.adresseFormatee}</span>
            </div>
          )}

          {mission.lieuDepot?.adresseFormatee && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="size-3.5 shrink-0" />
              <span className="truncate">Depot : {mission.lieuDepot.adresseFormatee}</span>
            </div>
          )}

          {mission.benevoleNomComplet && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3.5 shrink-0" />
              <span>{mission.benevoleNomComplet}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
