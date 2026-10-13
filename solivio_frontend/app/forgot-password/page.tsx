"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
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
      <AuthLayout title="Email envoyé">
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-base font-semibold text-foreground font-display">Code envoyé !</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Si un compte est associe a{" "}
              <strong className="text-foreground">{email}</strong>, vous allez recevoir
              un email avec un code de réinitialisation.
            </p>
          </div>
        </div>
        <Link
          href={`/reset-password?email=${encodeURIComponent(email)}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 h-10 text-sm font-semibold text-primary-foreground shadow-primary hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          Saisir le code de vérification
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      description="Entrez votre adresse email pour recevoir un code de réinitialisation."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              className="pl-9"
            />
          </div>
        </div>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <><Spinner size="sm" /> Envoi en cours...</>
          ) : (
            "Envoyer le code"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthLayout>
  );
}
