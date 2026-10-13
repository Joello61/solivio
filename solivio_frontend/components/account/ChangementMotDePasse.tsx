"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { changerMotDePasse, logout } from "@/lib/auth";

// Meme politique que le backend (MotDePasseRobuste) : la liste des mots de passe
// courants n'est verifiee que cote serveur.
const LONGUEUR_MIN = 8;
const LONGUEUR_MAX = 128;

/** Changement de mot de passe d'un compte email ; toutes les sessions sont ensuite fermees. */
export function ChangementMotDePasse() {
  const router = useRouter();
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function valider(): string | null {
    const longueur = [...nouveau].length;
    if (longueur < LONGUEUR_MIN || longueur > LONGUEUR_MAX) {
      return `Le nouveau mot de passe doit contenir entre ${LONGUEUR_MIN} et ${LONGUEUR_MAX} caractères.`;
    }
    if (nouveau !== confirmation) return "Les deux mots de passe ne correspondent pas.";
    if (nouveau === actuel) return "Le nouveau mot de passe doit être différent de l'actuel.";
    return null;
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const invalide = valider();
    if (invalide) {
      setErreur(invalide);
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      await changerMotDePasse(actuel, nouveau);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Le mot de passe n'a pas pu être modifié.");
      setEnCours(false);
      return;
    }
    // Le backend revoque toutes les sessions : on se reconnecte avec le nouveau mot de passe.
    await logout().catch(() => {});
    router.replace("/login?motDePasse=modifie");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Mot de passe</h2>
          <p className="text-sm text-muted-foreground">
            Après le changement, vous serez déconnecté de tous vos appareils.
          </p>
        </div>
      </div>

      <form onSubmit={envoyer} className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="mdp-actuel">Mot de passe actuel</Label>
          <PasswordInput
            id="mdp-actuel"
            required
            autoComplete="current-password"
            value={actuel}
            onChange={(e) => setActuel(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mdp-nouveau">Nouveau mot de passe</Label>
          <PasswordInput
            id="mdp-nouveau"
            required
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mdp-confirmation">Confirmation</Label>
          <PasswordInput
            id="mdp-confirmation"
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

        {erreur && (
          <p role="alert" className="sm:col-span-3 rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
            {erreur}
          </p>
        )}

        <div className="sm:col-span-3">
          <Button type="submit" size="sm" disabled={enCours}>
            {enCours && <Spinner size="sm" className="mr-2" />}
            Changer le mot de passe
          </Button>
        </div>
      </form>
    </section>
  );
}
