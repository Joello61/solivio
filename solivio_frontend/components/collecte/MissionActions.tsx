"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  prendreEnCharge,
  libererMission,
  validerCollecte,
  validerDepot,
  annulerMission,
} from "@/lib/api/collecte";
import { cn } from "@/lib/utils";
import type { StatutMission } from "@/types/collecte";

interface Props {
  missionId: string;
  statut: StatutMission;
  assigneAuLecteur: boolean;
  estGestionnaire: boolean;
  estBenevole: boolean;
}

export function MissionActions({ missionId, statut, assigneAuLecteur, estGestionnaire, estBenevole }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [raisonAnnulation, setRaisonAnnulation] = useState("");
  const [showAnnulationForm, setShowAnnulationForm] = useState(false);

  // Le backend compare a la personne : l'id du compte ne correspond jamais a benevoleId.
  const estAssigne = assigneAuLecteur;

  async function executer(action: string, fn: () => Promise<unknown>) {
    setPending(action);
    setErreur(null);
    try {
      await fn();
      router.refresh();
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
    } finally {
      setPending(null);
    }
  }

  const peutModifier = estGestionnaire && statut === "DISPONIBLE";
  const peutPrendre = estBenevole && statut === "DISPONIBLE";
  const peutLiberer = estBenevole && estAssigne && statut === "PRISE_EN_CHARGE";
  const peutValiderCollecte = estGestionnaire && statut === "PRISE_EN_CHARGE";
  const peutValiderDepot = estBenevole && estAssigne && statut === "COLLECTE_EFFECTUEE";
  const peutAnnuler = (estGestionnaire || estAssigne) && ["DISPONIBLE", "PRISE_EN_CHARGE", "COLLECTE_EFFECTUEE"].includes(statut);

  if (!peutModifier && !peutPrendre && !peutLiberer && !peutValiderCollecte && !peutValiderDepot && !peutAnnuler) {
    return null;
  }

  return (
    <div className="space-y-3">
      {erreur && (
        <p className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-2">
          {erreur}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {peutPrendre && (
          <Button
            onClick={() => executer("prendre", () => prendreEnCharge(missionId))}
            disabled={pending !== null}
            size="sm"
          >
            {pending === "prendre" ? <Spinner className="mr-2 size-4" /> : null}
            Prendre en charge
          </Button>
        )}

        {peutModifier && (
          <Link
            href={`/missions-collecte/${missionId}/modifier`}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            <Pencil className="mr-2 size-4" />
            Modifier
          </Link>
        )}

        {peutLiberer && (
          <Button
            variant="outline"
            onClick={() => executer("liberer", () => libererMission(missionId))}
            disabled={pending !== null}
            size="sm"
          >
            {pending === "liberer" ? <Spinner className="mr-2 size-4" /> : null}
            Se désister
          </Button>
        )}

        {peutValiderCollecte && (
          <Button
            onClick={() => executer("valider-collecte", () => validerCollecte(missionId))}
            disabled={pending !== null}
            size="sm"
          >
            {pending === "valider-collecte" ? <Spinner className="mr-2 size-4" /> : null}
            Valider la collecte
          </Button>
        )}

        {peutValiderDepot && (
          <Button
            onClick={() => executer("valider-depot", () => validerDepot(missionId))}
            disabled={pending !== null}
            size="sm"
          >
            {pending === "valider-depot" ? <Spinner className="mr-2 size-4" /> : null}
            Valider le dépôt
          </Button>
        )}

        {peutAnnuler && !showAnnulationForm && (
          <Button
            variant="destructive"
            onClick={() => setShowAnnulationForm(true)}
            disabled={pending !== null}
            size="sm"
          >
            Annuler la mission
          </Button>
        )}
      </div>

      {showAnnulationForm && (
        <div className="space-y-2">
          <input
            type="text"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            placeholder="Raison de l'annulation..."
            value={raisonAnnulation}
            onChange={(e) => setRaisonAnnulation(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={!raisonAnnulation.trim() || pending !== null}
              onClick={() =>
                executer("annuler", () => annulerMission(missionId, raisonAnnulation))
              }
            >
              {pending === "annuler" ? <Spinner className="mr-2 size-4" /> : null}
              Confirmer l&apos;annulation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAnnulationForm(false);
                setRaisonAnnulation("");
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
