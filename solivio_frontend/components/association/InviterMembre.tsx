"use client";

import { useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviterMembre } from "@/lib/api/association";
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
      setErreur(err instanceof Error ? err.message : "L'invitation n'a pas pu être envoyée.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={ouvrir}>
        <UserPlus className="mr-2 size-4" />
        Inviter un membre
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              La personne reçoit un lien par email pour créer son compte. Il reste valable 7 jours.
            </DialogDescription>
          </DialogHeader>

          {envoyeA ? (
            <div role="status" className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>Invitation envoyée à {envoyeA}.</span>
            </div>
          ) : (
            <form onSubmit={envoyer} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invitation-email">Email</Label>
                <Input
                  id="invitation-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invitation-role">Rôle</Label>
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
              </div>

              {role === "coordinateur" && (
                <div className="space-y-1.5">
                  <Label htmlFor="invitation-coordination">Type de coordination</Label>
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
                </div>
              )}

              {erreur && (
                <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
                  {erreur}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOuvert(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={enCours}>
                  {enCours && <Spinner size="sm" className="mr-2" />}
                  Envoyer l&apos;invitation
                </Button>
              </DialogFooter>
            </form>
          )}

          {envoyeA && (
            <DialogFooter>
              <Button variant="outline" onClick={ouvrir}>
                Inviter une autre personne
              </Button>
              <Button onClick={() => setOuvert(false)}>Fermer</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
