"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  publierSession,
  demarrerSession,
  terminerSession,
  annulerSession,
  inscrireSession,
  desinscrireSession,
} from "@/lib/api/reconditionnement";
import type { StatutSession } from "@/types/reconditionnement";

interface Props {
  sessionId: string;
  statut: StatutSession;
  estResponsable: boolean;
  estCoordinateur: boolean;
}

export function SessionActions({ sessionId, statut, estResponsable, estCoordinateur }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const refresh = () => router.refresh();

  async function executer(action: string, fn: () => Promise<unknown>) {
    setPending(action);
    setErreur(null);
    try {
      await fn();
      refresh();
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
    } finally {
      setPending(null);
    }
  }

  const peutPublier = estResponsable && statut === "BROUILLON";
  const peutDemarrer = estResponsable && statut === "PUBLIEE";
  const peutTerminer = estResponsable && statut === "EN_COURS";
  const peutAnnuler = estResponsable && ["BROUILLON", "PUBLIEE", "EN_COURS"].includes(statut);
  const peutSInscrire = statut === "PUBLIEE" && !estCoordinateur;
  const peutSeDesinscrire = statut === "PUBLIEE" && !estCoordinateur;

  if (
    !peutPublier &&
    !peutDemarrer &&
    !peutTerminer &&
    !peutAnnuler &&
    !peutSInscrire &&
    !peutSeDesinscrire
  ) {
    return null;
  }

  function demanderMotif(): string | null {
    return window.prompt("Motif d'annulation :");
  }

  return (
    <div className="space-y-3">
      {erreur && (
        <p className="text-sm text-destructive rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-2">
          {erreur}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {peutPublier && (
          <Button
            size="sm"
            onClick={() => executer("publier", () => publierSession(sessionId))}
            disabled={!!pending}
          >
            {pending === "publier" ? <Spinner size="sm" /> : "Publier"}
          </Button>
        )}
        {peutDemarrer && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => executer("demarrer", () => demarrerSession(sessionId))}
            disabled={!!pending}
          >
            {pending === "demarrer" ? <Spinner size="sm" /> : "Démarrer"}
          </Button>
        )}
        {peutTerminer && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => executer("terminer", () => terminerSession(sessionId))}
            disabled={!!pending}
          >
            {pending === "terminer" ? <Spinner size="sm" /> : "Terminer"}
          </Button>
        )}
        {peutAnnuler && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              const motif = demanderMotif();
              if (motif) executer("annuler", () => annulerSession(sessionId, motif));
            }}
            disabled={!!pending}
          >
            {pending === "annuler" ? <Spinner size="sm" /> : "Annuler"}
          </Button>
        )}
        {peutSInscrire && (
          <Button
            size="sm"
            onClick={() => executer("inscrire", () => inscrireSession(sessionId))}
            disabled={!!pending}
          >
            {pending === "inscrire" ? <Spinner size="sm" /> : "S'inscrire"}
          </Button>
        )}
        {peutSeDesinscrire && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => executer("desinscrire", () => desinscrireSession(sessionId))}
            disabled={!!pending}
          >
            {pending === "desinscrire" ? <Spinner size="sm" /> : "Se désinscrire"}
          </Button>
        )}
      </div>
    </div>
  );
}
