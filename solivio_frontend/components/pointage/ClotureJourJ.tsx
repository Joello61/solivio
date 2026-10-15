"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { terminerDistribution } from "@/lib/api/distributions";
import { messageErreur } from "@/lib/erreurs";

interface Props {
  distributionId: string;
  /* Beneficiaires encore a pointer, comptes absents a la cloture (RG4). */
  nonPointes: number;
}

/* Fin du jour J : la cloture compte les absences et mene au bilan. */
export function ClotureJourJ({ distributionId, nonPointes }: Props) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function clore() {
    setEnCours(true);
    setErreur(null);
    try {
      await terminerDistribution(distributionId);
      router.push(`/distributions/${distributionId}?onglet=bilan`);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e, "La clôture n'a pas abouti. Réessayez dans un instant."));
      setEnCours(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col items-start gap-2 border-t border-border pt-6">
      <p className="text-base text-muted-foreground">La distribution est finie ? Clôturez-la pour voir le bilan.</p>
      <Button variant="outline" size="lg" onClick={() => setOuvert(true)}>
        <Flag aria-hidden="true" />
        Clore et voir le bilan
      </Button>
      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Clore la distribution</DialogTitle>
            <DialogDescription>
              {nonPointes > 0
                ? `${nonPointes} personne${nonPointes > 1 ? "s" : ""} encore à pointer ${nonPointes > 1 ? "seront comptées absentes" : "sera comptée absente"}. Un pointage reste corrigeable ensuite.`
                : "Tout le monde est pointé. Le bilan devient disponible."}
            </DialogDescription>
          </DialogHeader>
          {erreur && <Alert variant="destructive">{erreur}</Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOuvert(false)}>
              Continuer le pointage
            </Button>
            <Button disabled={enCours} onClick={clore}>
              {enCours && <Spinner size="sm" />}
              Clore la distribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
