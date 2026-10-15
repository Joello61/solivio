"use client";

import { ParticipationActivite } from "@/components/activites/ParticipationActivite";
import { desinscrireSession, inscrireSession } from "@/lib/api/reconditionnement";

interface Props {
  sessionId: string;
  inscrit: boolean;
  /* Inscription et desinscription ne sont possibles qu'avant le demarrage. */
  ouverte: boolean;
  complet: boolean;
}

export function ParticipationSession({ sessionId, inscrit, ouverte, complet }: Props) {
  if (!ouverte) {
    return inscrit ? <p className="rounded-xl bg-secondary px-4 py-3 text-base text-foreground">Votre place est réservée pour cette session.</p> : null;
  }
  return (
    <ParticipationActivite
      objet="la session"
      inscription={inscrit ? "Votre place est réservée." : null}
      choix={[{ cle: "inscription", libelle: "Je m'inscris", detail: "Une confirmation vous est envoyée par email.", complet }]}
      inscrire={() => inscrireSession(sessionId)}
      desinscrire={() => desinscrireSession(sessionId)}
    />
  );
}
