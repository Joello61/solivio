"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
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
  supprimerDistribution,
  annulerDemarrageDistribution,
  reactiverDistribution,
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
  const [suppressionOpen, setSuppressionOpen] = useState(false);
  const [reactivationOpen, setReactivationOpen] = useState(false);

  const aujourd = new Date();
  aujourd.setHours(0, 0, 0, 0);
  const dateDistrib = new Date(distributionDate + "T00:00:00");
  const estDateFuture = dateDistrib > aujourd;
  const estDatePassee = dateDistrib < aujourd;

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
        case "annuler-demarrage":
          await annulerDemarrageDistribution(distributionId);
          break;
        case "reactiver":
          await reactiverDistribution(distributionId);
          setReactivationOpen(false);
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

  async function confirmerSuppression() {
    setPending("supprimer");
    setErreur(null);
    try {
      await supprimerDistribution(distributionId);
      setSuppressionOpen(false);
      router.push("/distributions");
      router.refresh();
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
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
            {pending === "demarrer" ? <><Spinner size="sm" /> Démarrage...</> : "Démarrer"}
          </Button>
        )}

        {statut === "EN_COURS" && (
          <Button size="sm" onClick={() => executer("terminer")} disabled={pending !== null}>
            {pending === "terminer" ? <><Spinner size="sm" /> Clôture...</> : "Terminer"}
          </Button>
        )}

        {/* Demarrage accidentel : le backend refuse si une presence a deja ete pointee. */}
        {statut === "EN_COURS" && (
          <Button size="sm" variant="outline" onClick={() => executer("annuler-demarrage")} disabled={pending !== null}>
            <Undo2 className="size-3.5 mr-1" />
            {pending === "annuler-demarrage" ? "Retour..." : "Revenir à publiée"}
          </Button>
        )}

        {statut === "ANNULEE" && !estDatePassee && (
          <Button size="sm" variant="outline" onClick={() => setReactivationOpen(true)} disabled={pending !== null}>
            <RotateCcw className="size-3.5 mr-1" />
            Réactiver
          </Button>
        )}

        {(statut === "BROUILLON" || statut === "PUBLIEE") && (
          <Link href={`/distributions/${distributionId}/modifier`} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
            <Pencil className="size-3.5 mr-1" />
            Modifier
          </Link>
        )}

        {statut === "BROUILLON" && (
          <Button size="sm" variant="outline" onClick={() => setSuppressionOpen(true)} disabled={pending !== null}>
            <Trash2 className="size-3.5 mr-1" />
            Supprimer le brouillon
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
            Le démarrage sera possible le{" "}
            {dateDistrib.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}.
          </p>
        )}
      </div>

      {/* Reactivation apres une annulation par erreur : les inscriptions sont retablies (backend). */}
      <Dialog open={reactivationOpen} onOpenChange={setReactivationOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Réactiver la distribution</DialogTitle>
            <DialogDescription>
              Elle retrouve son état d&apos;avant l&apos;annulation. Les inscriptions supprimées par
              l&apos;annulation sont rétablies, sauf pour les personnes inscrites entre-temps à une autre
              distribution de la semaine. Chacun est prévenu par email.
            </DialogDescription>
          </DialogHeader>
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivationOpen(false)}>
              Retour
            </Button>
            <Button onClick={() => executer("reactiver")} disabled={pending !== null}>
              {pending === "reactiver" && <Spinner size="sm" className="mr-2" />}
              Réactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suppression d'un brouillon : jamais publie, donc sans inscrit */}
      <Dialog open={suppressionOpen} onOpenChange={setSuppressionOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Supprimer le brouillon</DialogTitle>
            <DialogDescription>
              Ce brouillon et ses créneaux seront supprimés définitivement. Personne n&apos;y est inscrit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuppressionOpen(false)}>
              Retour
            </Button>
            <Button variant="destructive" onClick={confirmerSuppression} disabled={pending === "supprimer"}>
              {pending === "supprimer" ? <><Spinner size="sm" /> Suppression...</> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation d'annulation avec motif */}
      <Dialog open={annulationOpen} onOpenChange={setAnnulationOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/30 mb-1">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Annuler la distribution</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les participants inscrits seront notifies.
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
              placeholder="Ex : manque de denrées disponibles..."
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
