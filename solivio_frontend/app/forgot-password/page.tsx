"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { forgotPassword } from "@/lib/auth";
import { messageErreur } from "@/lib/erreurs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(messageErreur(err, "Erreur"));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Email envoyé">
        <p className="text-base text-foreground">
          Si un compte existe pour <strong className="font-semibold">{email}</strong>, un code de
          réinitialisation vient de lui être envoyé. Pensez à regarder dans les indésirables.
        </p>
        <Link
          href={`/reset-password?email=${encodeURIComponent(email)}`}
          className={buttonVariants({ className: "w-full" })}
        >
          Saisir le code de vérification
        </Link>
        <RetourConnexion />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      description="Indiquez votre adresse email : nous vous enverrons un code pour choisir un nouveau mot de passe."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner size="sm" /> Envoi en cours...
            </>
          ) : (
            "Envoyer le code"
          )}
        </Button>
      </form>

      <RetourConnexion />
    </AuthLayout>
  );
}

function RetourConnexion() {
  return (
    <p className="text-center text-base">
      <Link href="/login" className="font-semibold text-primary hover:underline">
        Retour à la connexion
      </Link>
    </p>
  );
}
