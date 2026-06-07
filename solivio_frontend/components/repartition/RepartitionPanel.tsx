"use client";

import { useState, useCallback } from "react";
import { Pencil, Trash2, Plus, AlertTriangle, Users } from "lucide-react";
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
}

export function RepartitionPanel({
  distributionId,
  denreesInitiales,
  dotationInitiale,
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

  const dotationParId = Object.fromEntries(
    dotation.denrees.map((d) => [d.id, d]),
  );

  return (
    <div className="space-y-6">
      {/* Bascule inscrits / presents */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Base de calcul : {dotation.nbBeneficiaires} beneficiaire
            {dotation.nbBeneficiaires > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => handleBasculeBase("INSCRITS")}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              base === "INSCRITS"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inscrits
          </button>
          <button
            type="button"
            onClick={() => handleBasculeBase("PRESENTS")}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              base === "PRESENTS"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Presents reels
          </button>
        </div>
      </div>

      {erreur && (
        <p className="text-sm text-destructive">{erreur}</p>
      )}

      {/* Liste des denrees avec dotation */}
      <div className="space-y-3">
        {denrees.length === 0 && !ajoutVisible && (
          <p className="text-sm text-muted-foreground">Aucune denree saisie pour cette distribution.</p>
        )}

        {denrees.map((denree) => {
          const d = dotationParId[denree.id];
          const estEnEdition = enEdition === denree.id;

          return (
            <div
              key={denree.id}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
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
                      <p className="text-xs text-muted-foreground">
                        {denree.nombreContenants} contenant(s) x{" "}
                        {formatQte(denree.quantiteParContenant, denree.unite)} ={" "}
                        <span className="font-medium">
                          {formatQte(denree.quantiteTotale, denree.unite)} total
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEnEdition(denree.id)}
                        aria-label="Modifier"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuppression(denree.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {d && (
                    <div className="flex items-center gap-3 pt-1 border-t border-border">
                      {d.penurie ? (
                        <div className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-amber-700 dark:text-amber-400">
                            Stock insuffisant : {d.nbPeutRecevoir} personne
                            {d.nbPeutRecevoir > 1 ? "s" : ""} sur{" "}
                            {dotation.nbBeneficiaires} peuvent recevoir{" "}
                            <span className="font-semibold">
                              1 {d.unite.toLowerCase()}
                            </span>
                            {d.reste > 0 && (
                              <span>
                                {" "}
                                (reste {formatQte(d.reste, d.unite)})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            Dotation :{" "}
                            <span className="font-semibold text-foreground">
                              {formatQte(d.dotation, d.unite)} / personne
                            </span>
                          </span>
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
      {ajoutVisible ? (
        <div className="rounded-lg border border-border bg-card p-4">
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
      )}
    </div>
  );
}
