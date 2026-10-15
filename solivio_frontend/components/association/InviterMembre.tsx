"use client";

import { useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviterMembre } from "@/lib/api/association";
import { messageErreur } from "@/lib/erreurs";
import type { InviterMembrePayload } from "@/types/association";

type Role = InviterMembrePayload["role"];

const ROLES: { value: Role; label: string }[] = [
  { value: "benevole", label: "Bénévole" },
  { value: "coordinateur", label: "Coordinateur" },
  { value: "responsable", label: "Responsable" },
];

const SANS_TYPE = "aucun";

const TYPES_COORDINATION = [
  { value: SANS_TYPE, label: "Non précisé" },
  { value: "coordo_generale", label: "Coordination générale" },
  { value: "coordo_sec", label: "Produits secs" },
  { value: "coordo_fruit_legume", label: "Fruits et légumes" },
  { value: "coordo_exterieur", label: "Extérieur" },
];

/** Invitation d'un membre par email ; l'acceptation passe par /register?invitation=. */
export function InviterMembre() {
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("benevole");
  const [coordoType, setCoordoType] = useState(SANS_TYPE);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoyeA, setEnvoyeA] = useState<string | null>(null);

  function ouvrir() {
    setEmail("");
    setRole("benevole");
    setCoordoType(SANS_TYPE);
    setErreur(null);
    setEnvoyeA(null);
    setOuvert(true);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      await inviterMembre({
        email: email.trim(),
        role,
        coordoType: role === "coordinateur" && coordoType !== SANS_TYPE ? coordoType : undefined,
      });
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
        Inviter un membre
      </Button>

      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Inviter un membre</SheetTitle>
            <SheetDescription>
              La personne reçoit un lien par email pour créer son compte. Il reste valable 7 jours.
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

              <FormField label="Rôle" htmlFor="invitation-role">
                <Select items={ROLES} value={role} onValueChange={(v) => v && setRole(v as Role)}>
                  <SelectTrigger id="invitation-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {role === "coordinateur" && (
                <FormField label="Type de coordination" htmlFor="invitation-coordination">
                  <Select
                    items={TYPES_COORDINATION}
                    value={coordoType}
                    onValueChange={(v) => v && setCoordoType(v)}
                  >
                    <SelectTrigger id="invitation-coordination" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_COORDINATION.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              {erreur && (
                <Alert variant="destructive">{erreur}</Alert>
              )}

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
