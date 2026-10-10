"use client";

import { useState, useTransition } from "react";
import { Search, Check, X } from "lucide-react";
import { pointer } from "@/lib/api/evenement";
import type { ParticipationEvenementResponse, PresenceEvenement } from "@/types/evenement";

const LABEL_ROLE: Record<string, string> = {
  STAFF: "Staff",
  PARTICIPANT: "Participant",
};

const COULEUR_PRESENCE: Record<string, string> = {
  NON_POINTE: "bg-slate-100 text-slate-600",
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-700",
};

const LABEL_PRESENCE: Record<string, string> = {
  NON_POINTE: "Non pointe",
  PRESENT: "Present",
  ABSENT: "Absent",
};

interface Props {
  evenementId: string;
  participationsInitiales: ParticipationEvenementResponse[];
}

export function PointageEvenementClient({ evenementId, participationsInitiales }: Props) {
  const [participations, setParticipations] = useState(participationsInitiales);
  const [recherche, setRecherche] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtrees = recherche.trim()
    ? participations.filter((p) =>
        p.personneNomComplet?.toLowerCase().includes(recherche.toLowerCase()),
      )
    : participations;

  function marquer(participationId: string, presence: PresenceEvenement) {
    startTransition(async () => {
      try {
        const updated = await pointer(evenementId, participationId, presence);
        setParticipations((prev) =>
          prev.map((p) => (p.id === participationId ? updated : p)),
        );
      } catch {
        // erreur silencieuse, l'etat reste inchange
      }
    });
  }

  const presents = participations.filter((p) => p.presence === "PRESENT").length;
  const total = participations.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {presents} / {total} pointe{total > 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un participant..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="rounded-2xl border border-border/60 overflow-hidden">
        {filtrees.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucun participant trouvé.
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {filtrees.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-neutral-900"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.personneNomComplet ?? "Inconnu"}
                  </p>
                  <p className="text-xs text-muted-foreground">{LABEL_ROLE[p.role] ?? p.role}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${COULEUR_PRESENCE[p.presence] ?? ""}`}
                  >
                    {LABEL_PRESENCE[p.presence] ?? p.presence}
                  </span>
                  <button
                    onClick={() => marquer(p.id, "PRESENT")}
                    disabled={isPending || p.presence === "PRESENT"}
                    title="Marquer present"
                    className="size-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center disabled:opacity-40 transition-colors"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => marquer(p.id, "ABSENT")}
                    disabled={isPending || p.presence === "ABSENT"}
                    title="Marquer absent"
                    className="size-8 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center disabled:opacity-40 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
