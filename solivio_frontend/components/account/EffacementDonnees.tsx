"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { effacerMesDonnees } from "@/lib/api/profil";

const CONFIRMATION = "SUPPRIMER";

/** Droit a l'effacement : la personne supprime elle-meme ses donnees. */
export function EffacementDonnees() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmer() {
    setEnCours(true);
    setErreur(null);
    try {
      await effacerMesDonnees();
      // Les cookies de session sont supprimes par le backend : retour a l'accueil.
      router.replace("/");
      router.refresh();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setErreur(err.message ?? "La suppression n'a pas pu aboutir.");
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-base text-muted-foreground">
        Votre compte, votre dossier et vos coordonnées seront supprimés définitivement. Votre nom
        disparaîtra de l&apos;historique des distributions, qui ne gardera que des chiffres anonymes.
      </p>
      <Button variant="destructive" onClick={() => setOuvert(true)}>
        <Trash2 aria-hidden="true" />
        Supprimer mes données
      </Button>

      <AlertDialog
        open={ouvert}
        onOpenChange={(open) => {
          if (!open) {
            setOuvert(false);
            setSaisie("");
            setErreur(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Supprimer définitivement mes données</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Pour confirmer, saisissez {CONFIRMATION} ci-dessous.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirmation-effacement">Confirmation</Label>
            <Input
              id="confirmation-effacement"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              autoComplete="off"
            />
            {erreur && <p className="text-xs text-destructive">{erreur}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button
              variant="destructive-solid"
              disabled={saisie !== CONFIRMATION || enCours}
              onClick={confirmer}
            >
              Supprimer mes données
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
