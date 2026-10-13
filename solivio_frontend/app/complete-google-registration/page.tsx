"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { completerInscriptionGoogle } from "@/lib/auth";

function CompleteGoogleRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const tokenInvitation = searchParams.get("invitation") ?? undefined;
  const isInvitation = !!tokenInvitation;

  const [nom, setNom] = useState(searchParams.get("nom") ?? "");
  const [prenom, setPrenom] = useState(searchParams.get("prenom") ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await completerInscriptionGoogle({
        email,
        nom,
        prenom,
        tokenInvitation: isInvitation ? tokenInvitation : undefined,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? (err as { detail?: string }).detail ?? err.message
          : "Erreur lors de la finalisation de l'inscription";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Finaliser votre inscription"
      description={
        isInvitation
          ? "Vérifiez vos informations pour accepter l'invitation."
          : "Vérifiez vos informations pour rejoindre Linkee Toulouse."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Adresse email</Label>
          <Input value={email} disabled className="bg-muted/50 cursor-not-allowed" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prenom">Prénom</Label>
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


        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner size="sm" /> Inscription en cours...
            </>
          ) : (
            "Rejoindre l'association"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function CompleteGoogleRegistrationPage() {
  return (
    <Suspense>
      <CompleteGoogleRegistrationForm />
    </Suspense>
  );
}
