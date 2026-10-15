"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ConnexionGoogle } from "@/components/auth/ConnexionGoogle";
import { FormError } from "@/components/auth/FormError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { login } from "@/lib/auth";
import { messageErreur } from "@/lib/erreurs";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const emailVerifie = searchParams.get("verified") === "1";
  const motDePasseModifie = searchParams.get("motDePasse") === "modifie";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [pending, setPending] = useState(false);
  // Renvoye par le backend apres une connexion Google d'un membre suspendu.
  const [error, setError] = useState<string | null>(
    searchParams.get("erreur") === "compte-suspendu"
      ? "Votre accès a été suspendu. Contactez un responsable de l'association."
      : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, motDePasse, rememberMe);
      router.push(redirect);
      router.refresh();
    } catch (err: unknown) {
      // Bon mot de passe mais adresse jamais confirmee : la saisie du code se fait
      // sur la page de verification, qui envoie un nouveau code (le precedent a pu expirer).
      if ((err as { code?: string }).code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(email)}&raison=non-verifie`);
        return;
      }
      setError(messageErreur(err, "Erreur de connexion"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title="Connexion" description="Retrouvez vos inscriptions et les prochaines distributions.">
      {emailVerifie && (
        <Alert role="status">
          <CheckCircle2 />
          <AlertDescription>Adresse email vérifiée. Vous pouvez vous connecter.</AlertDescription>
        </Alert>
      )}

      {motDePasseModifie && (
        <Alert role="status">
          <CheckCircle2 />
          <AlertDescription>Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Adresse email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>

        <FormField label="Mot de passe" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
          <Link href="/forgot-password" className="self-start text-sm font-semibold text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </FormField>

        <label className="flex min-h-11 cursor-pointer select-none items-center gap-3">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(v) => setRememberMe(Boolean(v))}
            aria-label="Rester connecté"
          />
          <span className="text-base text-foreground">Rester connecté</span>
        </label>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Spinner size="sm" />}
          {pending ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>

      <ConnexionGoogle libelle="Continuer avec Google" />

      <p className="text-center text-base text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}

// Next.js 16 : useSearchParams() doit etre dans un Suspense boundary.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
