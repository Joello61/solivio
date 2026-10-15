"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ChampCode, CODE_VIDE, codeComplet } from "@/components/auth/ChampCode";
import { FormError } from "@/components/auth/FormError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { resendVerification, verifyEmail } from "@/lib/auth";
import { messageErreur } from "@/lib/erreurs";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInitial = searchParams.get("email") ?? "";
  // Arrivee depuis la connexion d'un compte non verifie : le code recu a
  // l'inscription a pu expirer (15 minutes), un nouveau est envoye d'office.
  const depuisConnexion = searchParams.get("raison") === "non-verifie";

  const [email, setEmail] = useState(emailInitial);
  const [digits, setDigits] = useState(CODE_VIDE);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const renvoiAutomatiqueFait = useRef(false);

  async function renvoyerCode() {
    if (!email) {
      setError("Indiquez votre adresse email pour recevoir un code.");
      return;
    }
    setError(null);
    setInfo(null);
    setRenvoiEnCours(true);
    try {
      await resendVerification(email);
      setInfo(`Un nouveau code a été envoyé à ${email}.`);
    } catch (err: unknown) {
      setError(messageErreur(err, "Impossible d'envoyer un nouveau code."));
    } finally {
      setRenvoiEnCours(false);
    }
  }

  useEffect(() => {
    // Garde contre le double appel des effets en developpement.
    if (!depuisConnexion || !emailInitial || renvoiAutomatiqueFait.current) return;
    renvoiAutomatiqueFait.current = true;
    resendVerification(emailInitial)
      .then(() =>
        setInfo(
          `Votre adresse n'est pas encore vérifiée. Un nouveau code a été envoyé à ${emailInitial}.`
        )
      )
      .catch((err: unknown) => setError(messageErreur(err, "Impossible d'envoyer un nouveau code.")));
  }, [depuisConnexion, emailInitial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codeComplet(digits) || !email) return;
    setError(null);
    setPending(true);
    try {
      await verifyEmail(email, digits.join(""));
      router.push("/login?verified=1");
    } catch (err: unknown) {
      setError(messageErreur(err, "Code invalide ou expire"));
      setDigits(CODE_VIDE);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Vérifiez votre email"
      description={
        emailInitial
          ? `Saisissez le code à 6 chiffres envoyé à ${emailInitial}.`
          : "Indiquez votre adresse et le code à 6 chiffres reçu par email."
      }
    >
      {info && (
        <Alert role="status">
          <MailCheck />
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!emailInitial && (
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
        )}

        <ChampCode chiffres={digits} onChange={setDigits} />

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending || !codeComplet(digits) || !email}>
          {pending ? (
            <>
              <Spinner size="sm" /> Vérification...
            </>
          ) : (
            "Valider le code"
          )}
        </Button>
      </form>

      <p className="text-center text-base text-muted-foreground">
        Pas reçu le code, ou code expiré ?{" "}
        <Button type="button" variant="link" className="h-auto p-0 text-base" onClick={renvoyerCode} disabled={renvoiEnCours}>
          {renvoiEnCours ? "Envoi..." : "Renvoyer un code"}
        </Button>
      </p>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
