"use client";

import { useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { messageErreur } from "@/lib/erreurs";

interface Props {
  ouvert: boolean;
  onOpenChange: (ouvert: boolean) => void;
  /* "la distribution", "l'événement" : complete "Annuler" et "Garder". */
  objet: string;
  /* Qui sera prevenu, et comment. */
  consequence: string;
  exemple: string;
  /* Rattrapage possible, quand il existe. */
  aide?: ReactNode;
  onConfirmer: (motif: string) => Promise<unknown>;
}

/* Annulation avec un motif obligatoire : il est transmis aux personnes prevenues. */
export function FeuilleAnnulation({ ouvert, onOpenChange, objet, consequence, exemple, aide, onConfirmer }: Props) {
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmer() {
    setEnCours(true);
    setErreur(null);
    try {
      await onConfirmer(motif.trim());
      onOpenChange(false);
    } catch (e) {
      setErreur(messageErreur(e, "L'annulation n'a pas abouti. Réessayez dans un instant."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Sheet open={ouvert} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Annuler {objet}</SheetTitle>
          <SheetDescription>{consequence}</SheetDescription>
        </SheetHeader>
        <FormField label="Motif" htmlFor="motif-annulation" required hint={`Par exemple : ${exemple}`}>
          <Textarea id="motif-annulation" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} />
        </FormField>
        {aide && <p className="text-base text-muted-foreground">{aide}</p>}
        {erreur && <Alert variant="destructive">{erreur}</Alert>}
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button variant="destructive-solid" disabled={!motif.trim() || enCours} onClick={confirmer}>
            {enCours && <Spinner size="sm" />}
            Annuler {objet}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Garder {objet}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
