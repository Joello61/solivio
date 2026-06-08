"use client";

import { useState, useCallback } from "react";
import { Pencil, Trash2, Plus, AlertTriangle, Users, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [ajoutVisible, setAjoutVisible] = useState(false);
  const [enEdition, setEnEdition] = useState<string | null>(null);
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
      setAjoutVisible(false);
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
      setEnEdition(null);
    } catch {
      setErreur("Erreur lors de la modification.");
    }
  }

  async function handleSuppression(denreeId: string) {
    setErreur(null);
    try {
      await supprimerDenree(distributionId, denreeId);
      const [nouvelles, nouvelDotation] = await Promise.all([
        listerDenrees(distributionId),
        calculerDotation(distributionId, base),
      ]);
      setDenrees(nouvelles);
      setDotation(nouvelDotation);
    } catch {
      setErreur("Erreur lors de la suppression.");
    }
  }

  async function handleBasculeBase(nouvelleBase: "INSCRITS" | "PRESENTS") {
    setBase(nouvelleBase);
    await rafraichirDotation(nouvelleBase);
  }

  const dotationParId = Object.fromEntries(dotation.denrees.map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
      {!modifiable && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Scale className="h-4 w-4 shrink-0" />
          Cette distribution est cloturee. Les denrees sont en lecture seule.
        </div>
      )}

      {/* Bascule inscrits / presents */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>
            {dotation.nbBeneficiaires} beneficiaire{dotation.nbBeneficiaires > 1 ? "s" : ""}
          </span>
        </div>
        <div
          role="group"
          aria-label="Base de calcul"
          className="inline-flex gap-0.5 rounded-xl border border-border bg-muted/50 p-1"
        >
          {(["INSCRITS", "PRESENTS"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => handleBasculeBase(b)}
              className={[
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                base === b
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {b === "INSCRITS" ? "Inscrits" : "Presents reels"}
            </button>
          ))}
        </div>
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      {/* Liste des denrees avec dotation */}
      <div className="space-y-3">
        {denrees.length === 0 && !ajoutVisible && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune denree saisie pour cette distribution.
            </p>
            {modifiable && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Cliquez sur &quot;Ajouter une denree&quot; pour commencer.
              </p>
            )}
          </div>
        )}

        {denrees.map((denree) => {
          const d = dotationParId[denree.id];
          const estEnEdition = enEdition === denree.id;

          return (
            <div
              key={denree.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              {estEnEdition ? (
                <FormulaireDenree
                  initiales={denree}
                  onSubmit={(values) => handleModification(denree.id, values)}
                  onAnnuler={() => setEnEdition(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{denree.libelle}</p>
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
                          onClick={() => setEnEdition(denree.id)}
                          aria-label="Modifier"
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuppression(denree.id)}
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
                        <div className="flex items-center gap-3 text-sm">
                          <div className="rounded-lg bg-primary/10 px-3 py-1.5">
                            <span className="text-primary font-medium">
                              {formatQte(d.dotation, d.unite)} / personne
                            </span>
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
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulaire d'ajout */}
      {modifiable && (
        ajoutVisible ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-4">Nouvelle denree</h3>
            <FormulaireDenree
              onSubmit={handleAjout}
              onAnnuler={() => setAjoutVisible(false)}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAjoutVisible(true)}
            className="w-full"
          >
            <Plus className="mr-2 size-4" />
            Ajouter une denree
          </Button>
        )
      )}
    </div>
  );
}
