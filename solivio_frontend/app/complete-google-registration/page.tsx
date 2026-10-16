"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { ChoixRoles, erreurChoixRoles, type ChoixRolesValeur } from "@/components/shared/ChoixRoles";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { completerInscriptionGoogle } from "@/lib/auth";
import { messageErreur } from "@/lib/erreurs";
import { NOM_ASSOCIATION } from "@/lib/marque";

function CompleteGoogleRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const tokenInvitation = searchParams.get("invitation") ?? undefined;
  const isInvitation = !!tokenInvitation;

  const [nom, setNom] = useState(searchParams.get("nom") ?? "");
  const [prenom, setPrenom] = useState(searchParams.get("prenom") ?? "");
  const [choix, setChoix] = useState<ChoixRolesValeur>({ roles: [], attestationEtudiant: false });
  const [erreurRoles, setErreurRoles] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const erreurChoix = isInvitation ? null : erreurChoixRoles(choix);
    setErreurRoles(erreurChoix);
    if (erreurChoix) return;
    setPending(true);
    try {
      await completerInscriptionGoogle({
        email,
        nom,
        prenom,
        ...(isInvitation ? { tokenInvitation } : choix),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(messageErreur(err, "Erreur lors de la finalisation de l'inscription"));
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
          : `Vérifiez vos informations pour rejoindre ${NOM_ASSOCIATION}.`
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Adresse email" htmlFor="email" hint="Celle de votre compte Google.">
          <Input id="email" value={email} disabled />
        </FormField>

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

        {!isInvitation && (
          <ChoixRoles
            valeur={choix}
            onChange={(v) => {
              setChoix(v);
              setErreurRoles(null);
            }}
            erreur={erreurRoles}
          />
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

      <p className="text-center text-base text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
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
