"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
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
      <form onSubmit={envoyer} className="grid items-start gap-4 sm:grid-cols-3">
        <FormField label="Mot de passe actuel" htmlFor="mdp-actuel">
          <PasswordInput
            id="mdp-actuel"
            required
            autoComplete="current-password"
            value={actuel}
            onChange={(e) => setActuel(e.target.value)}
          />
        </FormField>
        <FormField label="Nouveau mot de passe" htmlFor="mdp-nouveau" hint="8 caractères minimum.">
          <PasswordInput
            id="mdp-nouveau"
            required
            autoComplete="new-password"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
          />
        </FormField>
        <FormField label="Confirmation" htmlFor="mdp-confirmation">
          <PasswordInput
            id="mdp-confirmation"
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </FormField>

        {erreur && (
          <Alert variant="destructive" className="sm:col-span-3">
            {erreur}
          </Alert>
        )}

        <div className="sm:col-span-3">
          <Button type="submit" disabled={enCours}>
            {enCours && <Spinner size="sm" />}
            Changer le mot de passe
          </Button>
        </div>
      </form>
  );
}
