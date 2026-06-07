"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  publierDistribution,
  demarrerDistribution,
  terminerDistribution,
  annulerDistribution,
} from "@/lib/api/distributions";
import type { StatutDistribution } from "@/types/distribution";

interface Props {
  distributionId: string;
  statut: StatutDistribution;
}

export function DistributionActions({ distributionId, statut }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function executer(action: string) {
    setPending(action);
    setErreur(null);
    try {
      switch (action) {
        case "publier":
          await publierDistribution(distributionId);
          break;
        case "demarrer":
          await demarrerDistribution(distributionId);
          break;
        case "terminer":
          await terminerDistribution(distributionId);
          break;
        case "annuler": {
          const motif = window.prompt("Motif d'annulation :") ?? "";
          if (!motif.trim()) {
            setPending(null);
            return;
          }
          await annulerDistribution(distributionId, motif);
          break;
        }
        default:
          break;
      }
      router.refresh();
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {erreur && (
        <p className="w-full text-xs text-destructive">{erreur}</p>
      )}
      {statut === "BROUILLON" && (
        <Button size="sm" onClick={() => executer("publier")} disabled={pending === "publier"}>
          {pending === "publier" ? "Publication..." : "Publier"}
        </Button>
      )}
      {statut === "PUBLIEE" && (
        <Button size="sm" onClick={() => executer("demarrer")} disabled={pending === "demarrer"}>
          {pending === "demarrer" ? "Demarrage..." : "Demarrer"}
        </Button>
      )}
      {statut === "EN_COURS" && (
        <Button size="sm" onClick={() => executer("terminer")} disabled={pending === "terminer"}>
          {pending === "terminer" ? "Cloture..." : "Terminer"}
        </Button>
      )}
      {(statut === "BROUILLON" || statut === "PUBLIEE" || statut === "EN_COURS") && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => executer("annuler")}
          disabled={pending === "annuler"}
        >
          {pending === "annuler" ? "Annulation..." : "Annuler"}
        </Button>
      )}
    </div>
  );
}
