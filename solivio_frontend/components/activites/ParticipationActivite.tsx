"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { messageErreur } from "@/lib/erreurs";

export interface ChoixParticipation {
  cle: string;
  libelle: string;
  /* Ce que le choix engage, en une ligne. */
  detail?: string;
  complet: boolean;
}

interface Props {
  /* Phrase qui confirme l'inscription en cours, null si la personne n'est pas inscrite. */
  inscription: string | null;
  choix: ChoixParticipation[];
  /* "l'événement", "la session". */
  objet: string;
  inscrire: (cle: string) => Promise<unknown>;
  desinscrire: () => Promise<unknown>;
}

/* S'inscrire a un evenement ou a une session, ou se retirer apres confirmation. */
export function ParticipationActivite({ inscription, choix, objet, inscrire, desinscrire }: Props) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  async function executer(cle: string, appel: () => Promise<unknown>, succes: string) {
    setEnCours(cle);
    setErreur(null);
    try {
      await appel();
      setConfirmation(false);
      toast.success(succes);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e, "L'action n'a pas abouti. Réessayez dans un instant."));
    } finally {
      setEnCours(null);
    }
  }

  if (!inscription && choix.length === 0) return null;

  return (
    <section aria-labelledby="titre-participation" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 id="titre-participation" className="font-display text-lg font-bold text-foreground">
        Votre participation
      </h2>
      {inscription ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-base text-foreground">{inscription}</p>
          <Button variant="outline" onClick={() => setConfirmation(true)}>
            Je ne peux plus venir
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {choix.map((c, i) => (
            <div key={c.cle} className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant={i === 0 ? "default" : "outline"}
                disabled={c.complet || enCours !== null}
                onClick={() => executer(c.cle, () => inscrire(c.cle), "Inscription enregistrée.")}
              >
                {enCours === c.cle && <Spinner size="sm" />}
                {c.libelle}
              </Button>
              <span className="text-base text-muted-foreground">{c.complet ? "Complet" : c.detail}</span>
            </div>
          ))}
        </div>
      )}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}

      <Dialog open={confirmation} onOpenChange={setConfirmation}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Se retirer de {objet}</DialogTitle>
            <DialogDescription>Votre place est libérée pour quelqu&apos;un d&apos;autre.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmation(false)}>
              Garder ma place
            </Button>
            <Button disabled={enCours !== null} onClick={() => executer("retrait", desinscrire, "C'est noté : votre place est libérée.")}>
              {enCours === "retrait" && <Spinner size="sm" />}
              Me retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
