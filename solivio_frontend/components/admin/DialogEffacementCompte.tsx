"use client";

import { Eraser } from "lucide-react";
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
import type { CompteAdminResponse } from "@/types/profil";

interface Props {
  compte: CompteAdminResponse;
  open: boolean;
  onFermer: () => void;
  onConfirmer: () => void;
}

/** Demande d'effacement RGPD recue hors de l'application. */
export function DialogEffacementCompte({ compte, open, onFermer, onConfirmer }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onFermer(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <Eraser className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Effacer les données personnelles</AlertDialogTitle>
          <AlertDialogDescription>
            Le compte de {compte.prenom} {compte.nom} sera supprimé, son dossier effacé et son nom
            anonymisé dans l&apos;historique. À utiliser pour une demande d&apos;effacement (RGPD).
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onFermer}>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirmer}>
            Effacer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
