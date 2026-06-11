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
import { apiPost } from "@/lib/api";
import type { TokenResponse } from "@/types/auth";

function CompleteGoogleRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const tokenInvitation = searchParams.get("invitation") ?? undefined;
  const isInvitation = !!tokenInvitation;

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [codeAssociation, setCodeAssociation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await apiPost<TokenResponse>("/api/auth/google/complete-registration", {
        email,
        nom,
        prenom,
        codeAssociation: isInvitation ? undefined : codeAssociation,
        tokenInvitation: isInvitation ? tokenInvitation : undefined,
      });

      if (data.tenants.length > 1) {
        sessionStorage.setItem("pending_token", data.accessToken);
        sessionStorage.setItem("pending_tenants", JSON.stringify(data.tenants));
        router.push("/tenant-select");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
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
          ? "Verifiez vos informations pour accepter l'invitation."
          : "Verifiez vos informations pour rejoindre votre association."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Adresse email</Label>
          <Input value={email} disabled className="bg-muted/50 cursor-not-allowed" />
        </div>

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
        Deja inscrit ?{" "}
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
