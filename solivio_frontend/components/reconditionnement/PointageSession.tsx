"use client";

import { PointageActivite } from "@/components/activites/PointageActivite";
import { pointerParticipant } from "@/lib/api/reconditionnement";
import type { PresencePointee } from "@/lib/pointage";
import type { InscriptionReconditionnementResponse } from "@/types/reconditionnement";

interface Props {
  sessionId: string;
  intitule: string;
  inscrits: InscriptionReconditionnementResponse[];
}

/* Le pointage d'une session designe la personne, pas l'inscription (backend). */
export function PointageSession({ sessionId, intitule, inscrits }: Props) {
  return (
    <PointageActivite
      quitter={`/reconditionnement/${sessionId}`}
      intitule={intitule}
      personnes={inscrits.map((i) => ({ id: i.personneId, nomComplet: i.nomComplet, presence: i.presence as PresencePointee }))}
      pointer={(personneId, presence) => pointerParticipant(sessionId, personneId, presence)}
    />
  );
}
