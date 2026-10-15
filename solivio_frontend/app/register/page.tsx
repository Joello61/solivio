"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ConnexionGoogle } from "@/components/auth/ConnexionGoogle";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { register } from "@/lib/auth";
import { messageErreur } from "@/lib/erreurs";
import { NOM_ASSOCIATION } from "@/lib/marque";
import { PHOTOS } from "@/lib/photos";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenInvitation = searchParams.get("invitation") ?? undefined;

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInvitation = Boolean(tokenInvitation);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register({
        email,
        motDePasse,
        nom,
        prenom,
        tokenInvitation,
      });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(messageErreur(err, "Erreur lors de l'inscription"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title={isInvitation ? "Rejoindre l'équipe" : "Créer un compte"}
      description={
        isInvitation
          ? `Complétez votre profil pour accepter l'invitation de ${NOM_ASSOCIATION}.`
          : "Pour vous inscrire aux distributions. Vous recevrez un code par email pour confirmer votre adresse."
      }
      photo={PHOTOS.equipeBanderole}
      accroche={isInvitation ? "Bienvenue dans l'équipe." : "Une place vous attend à la prochaine distribution."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Prénom" htmlFor="prenom">
          <Input
            id="prenom"
            required
            autoComplete="given-name"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
          />
        </FormField>
        <FormField label="Nom" htmlFor="nom">
          <Input
            id="nom"
            required
            autoComplete="family-name"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </FormField>

        <FormField label="Adresse email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>

        <FormField label="Mot de passe" htmlFor="password" hint="8 caractères au moins.">
          <PasswordInput
            id="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </FormField>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner size="sm" /> Inscription en cours...
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>

      <ConnexionGoogle libelle="S'inscrire avec Google" />

      <p className="text-center text-base text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
