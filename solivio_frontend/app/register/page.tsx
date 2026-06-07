"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenInvitation = searchParams.get("invitation") ?? undefined;
  const assoParam = searchParams.get("asso") ?? "";

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [codeAssociation, setCodeAssociation] = useState(assoParam.toUpperCase());
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
        codeAssociation: isInvitation ? undefined : codeAssociation,
        tokenInvitation,
      });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? (err as { detail?: string }).detail ?? err.message
          : "Erreur lors de l'inscription";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title={isInvitation ? "Rejoindre votre association" : "Creer un compte"}
      description={
        isInvitation
          ? "Completez votre profil pour accepter l'invitation."
          : "Inscrivez-vous en tant que beneficiaire."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prenom">Prenom</Label>
            <Input
              id="prenom"
              required
              autoComplete="given-name"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              required
              autoComplete="family-name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="8 caracteres minimum"
          />
        </div>

        {!isInvitation && (
          <div className="space-y-1.5">
            <Label htmlFor="code">Code de votre association</Label>
            <Input
              id="code"
              required
              value={codeAssociation}
              onChange={(e) => setCodeAssociation(e.target.value.toUpperCase())}
              placeholder="Ex: PILOTE"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Ce code vous est fourni par votre association.
            </p>
          </div>
        )}

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Inscription..." : "Creer mon compte"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Deja inscrit ?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
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
