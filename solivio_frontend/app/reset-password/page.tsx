"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ChampCode, CODE_VIDE, codeComplet } from "@/components/auth/ChampCode";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { resetPassword } from "@/lib/auth";
import { messageErreur } from "@/lib/erreurs";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState(CODE_VIDE);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (!codeComplet(digits)) {
      setError("Saisissez les 6 chiffres du code reçu par email.");
      return;
    }
    if (nouveauMotDePasse !== confirmation) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await resetPassword(email, code, nouveauMotDePasse);
      router.push("/login?motDePasse=modifie");
    } catch (err: unknown) {
      setError(messageErreur(err, "Erreur"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      description={email ? `Saisissez le code envoyé à ${email}.` : "Saisissez le code reçu par email."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <ChampCode chiffres={digits} onChange={setDigits} />

        <FormField label="Nouveau mot de passe" htmlFor="password" hint="8 caractères au moins.">
          <PasswordInput
            id="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
          />
        </FormField>

        <FormField label="Confirmer le mot de passe" htmlFor="confirm">
          <PasswordInput
            id="confirm"
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </FormField>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending || !codeComplet(digits)}>
          {pending ? (
            <>
              <Spinner size="sm" /> Modification...
            </>
          ) : (
            "Modifier le mot de passe"
          )}
        </Button>
      </form>

      <p className="text-center text-base">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
