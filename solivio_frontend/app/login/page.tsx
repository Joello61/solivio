"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2 } from "lucide-react";
import { AUTH_LOGIN_URL, login } from "@/lib/auth";

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
      ? "Votre acces a ete suspendu. Contactez un responsable de l'association."
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
      const msg =
        err instanceof Error
          ? (err as { detail?: string }).detail ?? err.message
          : "Erreur de connexion";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title="Connexion" description="Accès a votre espace association">
      {emailVerifie && (
        <Alert role="status">
          <CheckCircle2 />
          <AlertDescription>Adresse email verifiee. Vous pouvez vous connecter.</AlertDescription>
        </Alert>
      )}

      {motDePasseModifie && (
        <Alert role="status">
          <CheckCircle2 />
          <AlertDescription>
            Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Mot de passe oublie ?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(v) => setRememberMe(Boolean(v))}
            aria-label="Rester connecté"
          />
          <span className="text-sm text-muted-foreground">Rester connecté</span>
        </label>

        <FormError message={error} />

        <Button type="submit" className="w-full gap-2" disabled={pending}>
          {pending && <Spinner size="sm" />}
          {pending ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>

      <div className="relative flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs font-medium text-muted-foreground/60">ou</span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => {
          window.location.href = AUTH_LOGIN_URL;
        }}
        type="button"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
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
