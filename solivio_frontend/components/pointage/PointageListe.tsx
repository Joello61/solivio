"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { rechercherPointage, pointer } from "@/lib/api/distributions";
import type { PointageInfoResponse } from "@/types/distribution";

const DEBOUNCE_MS = 300;
const SEUIL_AUTO = 1;

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
      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {recherchePending ? (
            <Spinner size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          )}
          <Input
            className="pl-9"
            placeholder="Rechercher par nom ou prenom..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRechercheImmediate()}
            autoFocus
          />
        </div>
        <Button onClick={handleRechercheImmediate} disabled={recherchePending || !recherche.trim()}>
          {recherchePending ? <><Spinner size="sm" /> Recherche...</> : "Rechercher"}
        </Button>
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      {/* Etat vide apres recherche */}
      {!recherchePending && aRecherche && resultats.length === 0 && recherche && (
        <div className="rounded-2xl border border-border/60 bg-neutral-50 dark:bg-neutral-900 px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun inscrit trouve pour &quot;{recherche}&quot;.
          </p>
        </div>
      )}

      {/* Resultats */}
      {resultats.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm divide-y divide-border/60 overflow-hidden">
          {resultats.map((r) => (
            <div
              key={r.inscriptionId}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-primary text-[11px] font-semibold dark:bg-teal-950/30 dark:border-teal-800/40">
                  {(r.prenom?.[0] ?? "").toUpperCase()}{(r.nom?.[0] ?? "").toUpperCase()}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold truncate">
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
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="icon-lg"
                  variant={r.presence === "PRESENT" ? "default" : "outline"}
                  disabled={pending === r.inscriptionId}
                  onClick={() => handlePointer(r.inscriptionId, "PRESENT")}
                  aria-label="Marquer present"
                >
                  {pending === r.inscriptionId ? (
                    <Spinner size="sm" />
                  ) : (
                    <Check className="size-5" />
                  )}
                </Button>
                <Button
                  size="icon-lg"
                  variant={r.presence === "ABSENT" ? "destructive" : "outline"}
                  disabled={pending === r.inscriptionId}
                  onClick={() => handlePointer(r.inscriptionId, "ABSENT")}
                  aria-label="Marquer absent"
                >
                  {pending === r.inscriptionId ? (
                    <Spinner size="sm" />
                  ) : (
                    <X className="size-5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
