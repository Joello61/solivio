"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { desinscrire } from "@/lib/api/distributions";

interface Props {
  distributionId: string;
  inscriptionId: string;
  titre: string;
  benevole: boolean;
  enAttente: boolean;
}

/** Desinscription depuis Mes inscriptions, apres confirmation. */
export function BoutonDesinscription({ distributionId, inscriptionId, titre, benevole, enAttente }: Props) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmer() {
    setEnCours(true);
    setErreur(null);
    try {
      await desinscrire(distributionId, inscriptionId);
      setOuvert(false);
      router.refresh();
    } catch (e) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "La désinscription n'a pas pu aboutir.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0"
        onClick={() => {
          setErreur(null);
          setOuvert(true);
        }}
      >
        Me désinscrire
      </Button>
      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Se désinscrire</DialogTitle>
            <DialogDescription>
              {enAttente
                ? `Vous quitterez la liste d'attente de "${titre}".`
                : `Votre place pour "${titre}" sera proposée à la personne suivante en liste d'attente.`}
              {benevole && " Si la distribution est proche, les coordinateurs sont prévenus de votre désistement."}
            </DialogDescription>
          </DialogHeader>
          {erreur && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
              {erreur}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOuvert(false)}>
              Garder mon inscription
            </Button>
            <Button variant="destructive" onClick={confirmer} disabled={enCours}>
              {enCours && <Spinner size="sm" className="mr-2" />}
              Me désinscrire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
