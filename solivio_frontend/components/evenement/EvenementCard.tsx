"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, UserCheck } from "lucide-react";
import { Statut } from "@/components/ui/statut";
import { STATUT_EVENEMENT } from "@/lib/libelles";
import type { EvenementResponse } from "@/types/evenement";

const LABEL_TYPE: Record<string, string> = {
  STAND: "Stand",
  FETE: "Fête",
  AUTRE: "Événement",
};

interface Props {
  evenement: EvenementResponse;
}

export function EvenementCard({ evenement }: Props) {
  return (
    <Link
      href={`/evenements/${evenement.id}`}
      className="block rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {LABEL_TYPE[evenement.type] ?? evenement.type}
          </p>
          <h3 className="font-semibold text-foreground leading-snug truncate">{evenement.titre}</h3>
        </div>
        <Statut libelle={STATUT_EVENEMENT[evenement.statut]} />
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 shrink-0" />
          <span>
            {new Date(evenement.dateHeureDebut).toLocaleString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {evenement.lieuAdresseFormatee && (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{evenement.lieuAdresseFormatee}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          {evenement.aBesoiNStaff && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="size-3.5 shrink-0" />
              <span>
                {evenement.nbStaff}
                {evenement.capaciteStaff ? ` / ${evenement.capaciteStaff}` : ""} staff
              </span>
            </div>
          )}
          {evenement.ouvertParticipants && (
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" />
              <span>
                {evenement.nbParticipants}
                {evenement.capaciteParticipants ? ` / ${evenement.capaciteParticipants}` : ""}{" "}
                participants
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
