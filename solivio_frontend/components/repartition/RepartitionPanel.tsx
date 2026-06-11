"use client";

import { useState, useCallback } from "react";
import { Pencil, Trash2, Plus, AlertTriangle, Users, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormulaireDenree } from "./FormulaireDenree";
import {
  listerDenrees,
  saisirDenree,
  modifierDenree,
  supprimerDenree,
  calculerDotation,
} from "@/lib/api/distributions";
import type { DenreeResponse, DotationResponse, SaisirDenreePayload } from "@/types/distribution";

function formatQte(valeur: number, unite: string): string {
  const suffixes: Record<string, string> = {
    KILOGRAMME: "kg",
    LITRE: "L",
    PIECE: "piece(s)",
    UNITE: "unite(s)",
  };
  const suffix = suffixes[unite] ?? unite.toLowerCase();
  return `${valeur % 1 === 0 ? valeur.toFixed(0) : valeur.toFixed(2)} ${suffix}`;
}

interface Props {
  distributionId: string;
  denreesInitiales: DenreeResponse[];
  dotationInitiale: DotationResponse;
  modifiable: boolean;
}

export function RepartitionPanel({
  distributionId,
  denreesInitiales,
  dotationInitiale,
  modifiable,
}: Props) {
  const [denrees, setDenrees] = useState<DenreeResponse[]>(denreesInitiales);
  const [dotation, setDotation] = useState<DotationResponse>(dotationInitiale);
  const [base, setBase] = useState<"INSCRITS" | "PRESENTS">(dotationInitiale.base);
  const [modalMode, setModalMode] = useState<"creer" | "modifier" | null>(null);
  const [denreeEnEdition, setDenreeEnEdition] = useState<DenreeResponse | null>(null);
  const [suppressionCible, setSuppressionCible] = useState<{ id: string; libelle: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const rafraichirDotation = useCallback(
    async (nouvelleBase: "INSCRITS" | "PRESENTS") => {
      try {
        const d = await calculerDotation(distributionId, nouvelleBase);
        setDotation(d);
      } catch {
        setErreur("Erreur lors du calcul de la dotation.");
      }
    },
    [distributionId],
  );

  async function handleAjout(values: SaisirDenreePayload) {
    setErreur(null);
    try {
      await saisirDenree(distributionId, values);
      const [nouvelles, nouvelDotation] = await Promise.all([
        listerDenrees(distributionId),
        calculerDotation(distributionId, base),
      ]);
      setDenrees(nouvelles);
      setDotation(nouvelDotation);
      setModalMode(null);
    } catch {
      setErreur("Erreur lors de l'ajout de la denree.");
    }
  }

  async function handleModification(denreeId: string, values: SaisirDenreePayload) {
    setErreur(null);
    try {
      await modifierDenree(distributionId, denreeId, values);
      const [nouvelles, nouvelDotation] = await Promise.all([
        listerDenrees(distributionId),
        calculerDotation(distributionId, base),
      ]);
      setDenrees(nouvelles);
      setDotation(nouvelDotation);
      setModalMode(null);
      setDenreeEnEdition(null);
    } catch {
      setErreur("Erreur lors de la modification.");
    }
  }

  async function confirmerSuppression() {
    if (!suppressionCible) return;
    setErreur(null);
    try {
      await supprimerDenree(distributionId, suppressionCible.id);
      const [nouvelles, nouvelDotation] = await Promise.all([
        listerDenrees(distributionId),
        calculerDotation(distributionId, base),
      ]);
      setDenrees(nouvelles);
      setDotation(nouvelDotation);
    } catch {
      setErreur("Erreur lors de la suppression.");
    } finally {
      setSuppressionCible(null);
    }
  }

  async function handleBasculeBase(nouvelleBase: "INSCRITS" | "PRESENTS") {
    setBase(nouvelleBase);
    await rafraichirDotation(nouvelleBase);
  }

  function ouvrirCreation() {
    setDenreeEnEdition(null);
    setModalMode("creer");
  }

  function ouvrirModification(denree: DenreeResponse) {
    setDenreeEnEdition(denree);
    setModalMode("modifier");
  }

  function fermerModal() {
    setModalMode(null);
    setDenreeEnEdition(null);
  }

  const dotationParId = Object.fromEntries(dotation.denrees.map((d) => [d.id, d]));

  return (
    <>
      <div className="space-y-6">
        {!modifiable && (
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-muted-foreground">
            <Scale className="h-4 w-4 shrink-0" />
            Cette distribution est cloturee. Les denrees sont en lecture seule.
          </div>
        )}

        {/* Bascule inscrits / presents */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-800/40">
              <Users className="size-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {dotation.nbBeneficiaires}
            </span>
            <span className="text-sm text-muted-foreground">
              beneficiaire{dotation.nbBeneficiaires > 1 ? "s" : ""}
            </span>
          </div>
          <div
            role="group"
            aria-label="Base de calcul"
            className="inline-flex gap-0.5 rounded-xl border border-border/60 bg-neutral-100/80 dark:bg-neutral-800/60 p-1"
          >
            {(["INSCRITS", "PRESENTS"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleBasculeBase(b)}
                className={[
                  "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                  base === b
                    ? "bg-white dark:bg-neutral-700 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {b === "INSCRITS" ? "Inscrits" : "Presents reels"}
              </button>
            ))}
          </div>
        </div>

        {erreur && <p className="text-sm text-destructive">{erreur}</p>}

        {/* Liste des denrees */}
        <div className="space-y-3">
          {denrees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-neutral-50/80 dark:bg-neutral-900/50 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune denree saisie pour cette distribution.
              </p>
              {modifiable && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Cliquez sur &quot;Ajouter une denree&quot; pour commencer.
                </p>
              )}
            </div>
          ) : (
            denrees.map((denree) => {
              const d = dotationParId[denree.id];

              return (
                <div
                  key={denree.id}
                  className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{denree.libelle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {denree.nombreContenants} contenant(s) x{" "}
                        {formatQte(denree.quantiteParContenant, denree.unite)} ={" "}
                        <span className="font-medium text-foreground">
                          {formatQte(denree.quantiteTotale, denree.unite)} total
                        </span>
                      </p>
                    </div>
                    {modifiable && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => ouvrirModification(denree)}
                          aria-label="Modifier"
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSuppressionCible({ id: denree.id, libelle: denree.libelle })}
                          aria-label="Supprimer"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {d && (
                    <div className="pt-3 border-t border-border">
                      {d.penurie ? (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm">
                          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-amber-700 dark:text-amber-400">
                            Stock insuffisant : {d.nbPeutRecevoir} personne
                            {d.nbPeutRecevoir > 1 ? "s" : ""} sur{" "}
                            {dotation.nbBeneficiaires} peuvent recevoir{" "}
                            <span className="font-semibold">1 {d.unite.toLowerCase()}</span>
                            {d.reste > 0 && (
                              <span> (reste {formatQte(d.reste, d.unite)})</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-800/40 px-4 py-2">
                            <p className="text-xl font-bold text-primary leading-none tabular-nums">
                              {formatQte(d.dotation, d.unite)}
                            </p>
                            <p className="text-xs text-primary/70 mt-0.5">par personne</p>
                          </div>
                          {d.reste > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Reste : {formatQte(d.reste, d.unite)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {modifiable && (
          <Button variant="outline" size="sm" onClick={ouvrirCreation} className="w-full">
            <Plus className="mr-2 size-4" />
            Ajouter une denree
          </Button>
        )}
      </div>

      {/* Modal creation / modification */}
      <Dialog open={modalMode !== null} onOpenChange={(open) => { if (!open) fermerModal(); }}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "modifier" ? "Modifier la denree" : "Nouvelle denree"}
            </DialogTitle>
          </DialogHeader>
          <FormulaireDenree
            initiales={denreeEnEdition ?? undefined}
            onSubmit={(values) =>
              modalMode === "modifier" && denreeEnEdition
                ? handleModification(denreeEnEdition.id, values)
                : handleAjout(values)
            }
            onAnnuler={fermerModal}
          />
        </DialogContent>
      </Dialog>

      {/* Modal confirmation suppression */}
      <AlertDialog
        open={suppressionCible !== null}
        onOpenChange={(open) => { if (!open) setSuppressionCible(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Supprimer la denree</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{suppressionCible?.libelle}&quot; sera supprimee de cette distribution.
              La dotation sera recalculee automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSuppressionCible(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmerSuppression}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
