"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/auth";

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
      const msg =
        err instanceof Error ? (err as { detail?: string }).detail ?? err.message : "Erreur";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Email envoye">
        <p className="text-sm text-muted-foreground">
          Si un compte est associe a <strong>{email}</strong>, vous allez recevoir
          un email avec un code de reinitialisation.
        </p>
        <Link
          href={`/reset-password?email=${encodeURIComponent(email)}`}
          className="block text-center text-sm text-primary font-medium hover:underline"
        >
          Saisir le code
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublie"
      description="Entrez votre adresse email pour recevoir un code de reinitialisation."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
          />
        </div>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Envoi..." : "Envoyer le code"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Retour a la connexion
        </Link>
      </p>
    </AuthLayout>
  );
}
