import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Statut } from "@/components/ui/statut";
import { STATUT_SESSION } from "@/lib/libelles";
import type { SessionReconditionnementResponse } from "@/types/reconditionnement";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  session: SessionReconditionnementResponse;
}

export function SessionReconditionnementCard({ session }: Props) {
  return (
    <Link
      href={`/reconditionnement/${session.id}`}
      className="block rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-150 overflow-hidden"
    >
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground line-clamp-2">{session.titre}</h2>
          <Statut libelle={STATUT_SESSION[session.statut]} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            <span>{formatDate(session.dateHeureDebut)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span>
              {new Date(session.dateHeureDebut).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {new Date(session.dateHeureFin).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {session.lieu?.adresseFormatee && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{session.lieu.adresseFormatee}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            <span>
              {session.nbInscrits} inscrit{session.nbInscrits !== 1 ? "s" : ""}
              {session.capacite != null ? ` / ${session.capacite} places` : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
