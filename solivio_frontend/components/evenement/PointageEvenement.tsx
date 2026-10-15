"use client";

import { PointageActivite } from "@/components/activites/PointageActivite";
import { pointer } from "@/lib/api/evenement";
import type { ParticipationEvenementResponse } from "@/types/evenement";

interface Props {
  evenementId: string;
  intitule: string;
  participations: ParticipationEvenementResponse[];
}

export function PointageEvenement({ evenementId, intitule, participations }: Props) {
  return (
    <PointageActivite
      quitter={`/evenements/${evenementId}`}
      intitule={intitule}
      personnes={participations.map((p) => ({
        id: p.id,
        nomComplet: p.personneNomComplet ?? "Membre",
        presence: p.presence,
        groupe: p.role === "STAFF" ? "Équipe" : "Participants",
      }))}
      pointer={(id, presence) => pointer(evenementId, id, presence)}
    />
  );
}
