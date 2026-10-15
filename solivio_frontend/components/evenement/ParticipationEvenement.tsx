"use client";

import { ParticipationActivite } from "@/components/activites/ParticipationActivite";
import type { PlaceEvenement } from "@/lib/activites";
import { sInscrire, seDesinscrire } from "@/lib/api/evenement";
import type { RoleParticipation } from "@/types/evenement";

const CHOIX: Record<RoleParticipation, { libelle: string; detail: string }> = {
  STAFF: { libelle: "Rejoindre l'équipe", detail: "Vous aidez à l'organisation." },
  PARTICIPANT: { libelle: "Participer", detail: "Vous venez profiter de l'événement." },
};

interface Props {
  evenementId: string;
  monRole: RoleParticipation | null;
  places: PlaceEvenement[];
}

export function ParticipationEvenement({ evenementId, monRole, places }: Props) {
  return (
    <ParticipationActivite
      objet="l'événement"
      inscription={monRole === null ? null : monRole === "STAFF" ? "Vous faites partie de l'équipe." : "Votre participation est enregistrée."}
      choix={places.map((p) => ({ cle: p.role, complet: p.complet, ...CHOIX[p.role] }))}
      inscrire={(role) => sInscrire(evenementId, role as RoleParticipation)}
      desinscrire={() => seDesinscrire(evenementId)}
    />
  );
}
