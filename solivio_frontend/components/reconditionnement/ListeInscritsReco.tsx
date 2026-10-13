"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pointerParticipant } from "@/lib/api/reconditionnement";
import type { InscriptionReconditionnementResponse } from "@/types/reconditionnement";
import type { StatutSession } from "@/types/reconditionnement";

interface Props {
  sessionId: string;
  inscrits: InscriptionReconditionnementResponse[];
  statut: StatutSession;
  estCoordinateur: boolean;
}

const PRESENCE_LABELS: Record<string, string> = {
  NON_POINTE: "Non pointe",
  PRESENT: "Présent",
  ABSENT: "Absent",
};

const PRESENCE_CLASS: Record<string, string> = {
  NON_POINTE: "text-muted-foreground",
  PRESENT: "text-primary font-medium",
  ABSENT: "text-destructive font-medium",
};

export function ListeInscritsReco({ sessionId, inscrits, statut, estCoordinateur }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const peutPointer = estCoordinateur && (statut === "EN_COURS" || statut === "TERMINEE");

  if (inscrits.length === 0) return null;

  async function pointer(personneId: string, presence: "PRESENT" | "ABSENT") {
    if (!peutPointer) return;
    setPending(personneId + presence);
    try {
      await pointerParticipant(sessionId, personneId, presence);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <ScanLine className="size-4 text-muted-foreground" />
        <h2 className="font-semibold text-foreground text-sm">
          Inscrits ({inscrits.length})
        </h2>
      </div>
      <ul className="divide-y divide-border/40">
        {inscrits.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 px-6 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{i.nomComplet}</p>
              <p className={`text-xs ${PRESENCE_CLASS[i.presence] ?? "text-muted-foreground"}`}>
                {PRESENCE_LABELS[i.presence] ?? i.presence}
              </p>
            </div>
            {peutPointer && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={i.presence === "PRESENT" ? "default" : "outline"}
                  className="h-7 w-7 p-0"
                  disabled={!!pending}
                  onClick={() => pointer(i.personneId, "PRESENT")}
                  title="Présent"
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={i.presence === "ABSENT" ? "destructive" : "outline"}
                  className="h-7 w-7 p-0"
                  disabled={!!pending}
                  onClick={() => pointer(i.personneId, "ABSENT")}
                  title="Absent"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
