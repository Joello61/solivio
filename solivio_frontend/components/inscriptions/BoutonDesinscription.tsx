"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
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
import { actionBillet } from "@/components/ui/billet";
import { desinscrire } from "@/lib/api/distributions";
import { messageErreur } from "@/lib/erreurs";

interface Props {
  distributionId: string;
  inscriptionId: string;
  titre: string;
  benevole: boolean;
  enAttente: boolean;
  /* "billet" : action de pied de billet, sur fond pin. */
  apparence?: "bouton" | "billet";
}

/** Desinscription apres confirmation : la place revient a la liste d'attente. */
export function BoutonDesinscription({
  distributionId,
  inscriptionId,
  titre,
  benevole,
  enAttente,
  apparence = "bouton",
}: Props) {
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
      setErreur(messageErreur(e, "La désinscription n'a pas pu aboutir."));
    } finally {
      setEnCours(false);
    }
  }

  function ouvrir() {
    setErreur(null);
    setOuvert(true);
  }

  return (
    <>
      {apparence === "billet" ? (
        <button type="button" className={actionBillet} onClick={ouvrir}>
          {enAttente ? "Quitter la liste" : "Je ne peux plus venir"}
        </button>
      ) : (
        <Button type="button" variant="outline" className="shrink-0" onClick={ouvrir}>
          {enAttente ? "Quitter la liste d'attente" : "Je ne peux plus venir"}
        </Button>
      )}
      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{enAttente ? "Quitter la liste d'attente" : "Libérer ma place"}</DialogTitle>
            <DialogDescription>
              {enAttente
                ? `Vous quitterez la liste d'attente pour ${titre}.`
                : `Votre place pour ${titre} sera proposée à la personne suivante en liste d'attente.`}
              {benevole && " Si la distribution est proche, les coordinateurs sont prévenus de votre désistement."}
            </DialogDescription>
          </DialogHeader>
          {erreur && (
            <Alert variant="destructive">{erreur}</Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOuvert(false)}>
              Garder ma place
            </Button>
            <Button variant="destructive-solid" onClick={confirmer} disabled={enCours}>
              {enCours && <Spinner size="sm" />}
              {enAttente ? "Quitter la liste" : "Libérer ma place"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
