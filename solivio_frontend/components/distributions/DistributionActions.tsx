"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  distributionDate: string;
}

export function DistributionActions({ distributionId, statut, distributionDate }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [annulationOpen, setAnnulationOpen] = useState(false);
  const [motif, setMotif] = useState("");

  const aujourd = new Date();
  aujourd.setHours(0, 0, 0, 0);
  const dateDistrib = new Date(distributionDate + "T00:00:00");
  const estDateFuture = dateDistrib > aujourd;

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

  async function confirmerAnnulation() {
    if (!motif.trim()) return;
    setPending("annuler");
    setErreur(null);
    try {
      await annulerDistribution(distributionId, motif.trim());
      setAnnulationOpen(false);
      setMotif("");
      router.refresh();
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {erreur && <p className="w-full text-xs text-destructive">{erreur}</p>}

        {statut === "BROUILLON" && (
          <Button size="sm" onClick={() => executer("publier")} disabled={pending !== null}>
            {pending === "publier" ? <><Spinner size="sm" /> Publication...</> : "Publier"}
          </Button>
        )}

        {statut === "PUBLIEE" && (
          <Button
            size="sm"
            onClick={() => executer("demarrer")}
            disabled={pending !== null || estDateFuture}
          >
            {pending === "demarrer" ? <><Spinner size="sm" /> Demarrage...</> : "Demarrer"}
          </Button>
        )}

        {statut === "EN_COURS" && (
          <Button size="sm" onClick={() => executer("terminer")} disabled={pending !== null}>
            {pending === "terminer" ? <><Spinner size="sm" /> Cloture...</> : "Terminer"}
          </Button>
        )}

        {(statut === "BROUILLON" || statut === "PUBLIEE" || statut === "EN_COURS") && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setAnnulationOpen(true)}
            disabled={pending !== null}
          >
            Annuler
          </Button>
        )}

        {statut === "PUBLIEE" && estDateFuture && (
          <p className="w-full text-xs text-muted-foreground">
            Le demarrage sera possible le{" "}
            {dateDistrib.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}.
          </p>
        )}
      </div>

      {/* Dialog de confirmation d'annulation avec motif */}
      <Dialog open={annulationOpen} onOpenChange={setAnnulationOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/40 mb-1">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Annuler la distribution</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. Les participants inscrits seront notifies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="motif-annulation" className="text-sm font-medium">
              Motif d&apos;annulation <span className="text-destructive">*</span>
            </label>
            <textarea
              id="motif-annulation"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              placeholder="Ex : manque de denrees disponibles..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAnnulationOpen(false); setMotif(""); }}>
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={confirmerAnnulation}
              disabled={!motif.trim() || pending === "annuler"}
            >
              {pending === "annuler" ? <><Spinner size="sm" /> Annulation...</> : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
