"use client";

import { useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { inviterMembre } from "@/lib/api/association";
import { messageErreur } from "@/lib/erreurs";

/*
 * Invitation d'une personne sans compte a devenir responsable (ADR-012). Benevoles et
 * beneficiaires s'inscrivent seuls ; un membre se nomme responsable depuis sa fiche.
 */
export function InviterMembre() {
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoyeA, setEnvoyeA] = useState<string | null>(null);

  function ouvrir() {
    setEmail("");
    setErreur(null);
    setEnvoyeA(null);
    setOuvert(true);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      await inviterMembre({ email: email.trim() });
      setEnvoyeA(email.trim());
    } catch (err) {
      setErreur(messageErreur(err, "L'invitation n'a pas pu être envoyée."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <Button onClick={ouvrir}>
        <UserPlus aria-hidden="true" />
        Inviter un responsable
      </Button>

      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Inviter un responsable</SheetTitle>
            <SheetDescription>
              Pour une personne qui n&apos;a pas encore de compte : elle reçoit un lien par email, valable 7 jours, et
              devient responsable en créant son compte. Un membre déjà inscrit se nomme responsable depuis sa fiche.
            </SheetDescription>
          </SheetHeader>

          {envoyeA ? (
            <Alert role="status">
              <CheckCircle2 aria-hidden="true" />
              Invitation envoyée à {envoyeA}.
            </Alert>
          ) : (
            <form onSubmit={envoyer} className="flex flex-col gap-4">
              <FormField label="Email" htmlFor="invitation-email">
                <Input
                  id="invitation-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>

              {erreur && <Alert variant="destructive">{erreur}</Alert>}

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setOuvert(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={enCours}>
                  {enCours && <Spinner size="sm" className="mr-2" />}
                  Envoyer l&apos;invitation
                </Button>
              </SheetFooter>
            </form>
          )}

          {envoyeA && (
            <SheetFooter>
              <Button variant="outline" onClick={ouvrir}>
                Inviter une autre personne
              </Button>
              <Button onClick={() => setOuvert(false)}>Fermer</Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
