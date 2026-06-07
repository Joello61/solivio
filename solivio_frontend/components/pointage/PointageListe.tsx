"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rechercherPointage, pointer } from "@/lib/api/distributions";
import type { PointageInfoResponse } from "@/types/distribution";

const DEBOUNCE_MS = 300;
const SEUIL_AUTO = 2; // nombre de caracteres minimum pour declencher la recherche automatique

interface Props {
  distributionId: string;
}

export function PointageListe({ distributionId }: Props) {
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<PointageInfoResponse[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [recherchePending, setRecherchePending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [aRecherche, setARecherche] = useState(false);

  // Ref pour annuler le debounce si le composant est demonte ou si la valeur change.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executerRecherche = useCallback(
    async (terme: string) => {
      setRecherchePending(true);
      setErreur(null);
      setARecherche(true);
      try {
        const res = await rechercherPointage(distributionId, terme);
        setResultats(res);
      } catch (e: unknown) {
        const err = e as { detail?: string; message?: string };
        setErreur(err.detail ?? err.message ?? "Erreur lors de la recherche.");
      } finally {
        setRecherchePending(false);
      }
    },
    [distributionId],
  );

  // Recherche automatique declenchee par la frappe, avec debounce.
  // Toutes les mises a jour d'etat passent par le callback du setTimeout
  // pour eviter les setState synchrones dans un effect (lint react-hooks/set-state-in-effect).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const isTropCourt = recherche.length < SEUIL_AUTO;
    // Delai immediat pour l'effacement, debounce normal pour la recherche.
    const delai = isTropCourt ? 0 : DEBOUNCE_MS;

    debounceRef.current = setTimeout(() => {
      if (isTropCourt) {
        setResultats([]);
        setARecherche(false);
        return;
      }
      executerRecherche(recherche);
    }, delai);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [recherche, executerRecherche]);

  // Recherche immediate declenchee par le bouton ou la touche Entree.
  function handleRechercheImmediate() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    executerRecherche(recherche);
  }

  async function handlePointer(inscriptionId: string, presence: "PRESENT" | "ABSENT") {
    setPending(inscriptionId);
    setErreur(null);
    try {
      await pointer(distributionId, inscriptionId, presence);
      setResultats((prev) =>
        prev.map((r) => (r.inscriptionId === inscriptionId ? { ...r, presence } : r)),
      );
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Erreur lors du pointage.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Taper 2 lettres minimum pour rechercher..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRechercheImmediate()}
            autoFocus
          />
        </div>
        <Button onClick={handleRechercheImmediate} disabled={recherchePending}>
          {recherchePending ? "Recherche..." : "Rechercher"}
        </Button>
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      {recherchePending && (
        <p className="text-sm text-muted-foreground text-center py-2">Recherche en cours...</p>
      )}

      {!recherchePending && aRecherche && resultats.length === 0 && recherche && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun inscrit trouve pour &quot;{recherche}&quot;.
        </p>
      )}

      {resultats.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {resultats.map((r) => (
            <div key={r.inscriptionId} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {r.nom} {r.prenom}
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {r.type === "BENEFICIAIRE" ? "Beneficiaire" : "Benevole"}
                  </Badge>
                  {r.presence !== "NON_POINTE" && (
                    <Badge
                      variant={r.presence === "PRESENT" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {r.presence === "PRESENT" ? "Present" : "Absent"}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant={r.presence === "PRESENT" ? "default" : "outline"}
                  className="size-9"
                  disabled={pending === r.inscriptionId}
                  onClick={() => handlePointer(r.inscriptionId, "PRESENT")}
                  title="Marquer present"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant={r.presence === "ABSENT" ? "destructive" : "outline"}
                  className="size-9"
                  disabled={pending === r.inscriptionId}
                  onClick={() => handlePointer(r.inscriptionId, "ABSENT")}
                  title="Marquer absent"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
