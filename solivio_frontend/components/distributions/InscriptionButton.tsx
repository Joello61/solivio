"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inscrire, desinscrire } from "@/lib/api/distributions";
import type { InscriptionResponse, TypeInscription, CreneauResponse } from "@/types/distribution";

interface Props {
  distributionId: string;
  creneaux: CreneauResponse[];
  inscriptionExistante: InscriptionResponse | null;
  typeParDefaut: TypeInscription;
}

export function InscriptionButton({
  distributionId,
  creneaux,
  inscriptionExistante,
  typeParDefaut,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [creneauChoisi, setCreneauChoisi] = useState<string>(
    creneaux.length === 1 ? creneaux[0].id : "",
  );

  const estInscrit =
    inscriptionExistante !== null &&
    (inscriptionExistante.statut === "CONFIRMEE" ||
      inscriptionExistante.statut === "LISTE_ATTENTE");

  const necessisteChoixCreneau = creneaux.length > 1 && !estInscrit;

  async function handleInscrire() {
    if (necessisteChoixCreneau && !creneauChoisi) {
      setErreur("Veuillez choisir un créneau.");
      return;
    }
    setPending(true);
    setErreur(null);
    try {
      await inscrire(distributionId, typeParDefaut, creneauChoisi || undefined);
      router.refresh();
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Inscription impossible.");
    } finally {
      setPending(false);
    }
  }

  async function handleDesinscrire() {
    if (!inscriptionExistante) return;
    setPending(true);
    setErreur(null);
    try {
      await desinscrire(distributionId, inscriptionExistante.id);
      router.refresh();
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Désinscription impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      {estInscrit ? (
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-800/40 px-4 py-2.5">
            <p className="text-base font-bold text-primary leading-none">
              {inscriptionExistante?.statut === "LISTE_ATTENTE" ? "Liste d'attente" : "Inscrit(e)"}
            </p>
            {inscriptionExistante?.statut === "LISTE_ATTENTE" && (
              <p className="text-xs text-primary/70 mt-0.5">
                rang {inscriptionExistante.rangListeAttente ?? "?"}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={handleDesinscrire} disabled={pending}>
            {pending ? <><Spinner size="sm" /> Annulation...</> : "Se désinscrire"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {necessisteChoixCreneau && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="creneau-select">
                Choisir un créneau
              </label>
              <Select
                value={creneauChoisi || undefined}
                onValueChange={(v) => { if (v !== null) setCreneauChoisi(v); }}
              >
                <SelectTrigger id="creneau-select" className="w-full">
                  <SelectValue placeholder="-- Sélectionnez un créneau --" />
                </SelectTrigger>
                <SelectContent>
                  {creneaux.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.heureDebut} - {c.heureFin} ({c.capacite} places)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button size="sm" onClick={handleInscrire} disabled={pending}>
            {pending ? <><Spinner size="sm" /> Inscription...</> : "S'inscrire"}
          </Button>
        </div>
      )}
    </div>
  );
}
