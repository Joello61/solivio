"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { resendVerification, verifyEmail } from "@/lib/auth";

const CODE_VIDE = ["", "", "", "", "", ""];

function messageErreur(err: unknown, parDefaut: string): string {
  return err instanceof Error ? (err as { detail?: string }).detail ?? err.message : parDefaut;
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInitial = searchParams.get("email") ?? "";
  // Arrivee depuis la connexion d'un compte non verifie : le code recu a
  // l'inscription a pu expirer (15 minutes), un nouveau est envoye d'office.
  const depuisConnexion = searchParams.get("raison") === "non-verifie";

  const [email, setEmail] = useState(emailInitial);
  const [digits, setDigits] = useState(CODE_VIDE);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
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
      setInfo(`Un nouveau code a ete envoye a ${email}.`);
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
          `Votre adresse n'est pas encore verifiee. Un nouveau code a ete envoye a ${emailInitial}.`
        )
      )
      .catch((err: unknown) => setError(messageErreur(err, "Impossible d'envoyer un nouveau code.")));
  }, [depuisConnexion, emailInitial]);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6 || !email) return;
    setError(null);
    setPending(true);
    try {
      await verifyEmail(email, code);
      router.push("/login?verified=1");
    } catch (err: unknown) {
      setError(messageErreur(err, "Code invalide ou expire"));
      setDigits(CODE_VIDE);
      inputs.current[0]?.focus();
    } finally {
      setPending(false);
    }
  }

  const codeComplet = digits.join("").length === 6;

  return (
    <AuthLayout
      title="Verifiez votre email"
      description={
        emailInitial
          ? `Code a 6 chiffres envoye a ${emailInitial}`
          : "Entrez votre adresse et le code a 6 chiffres recu par email."
      }
    >
      {info && (
        <Alert role="status">
          <MailCheck />
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {!emailInitial && (
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
        )}

        <fieldset className="space-y-2">
          <legend className="sr-only">Code de verification</legend>
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Chiffre ${i + 1}`}
                className={[
                  "h-14 w-11 rounded-xl border-2 bg-white text-center text-xl font-bold font-mono",
                  "text-foreground caret-transparent transition-all duration-150",
                  "focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  "dark:bg-neutral-900",
                  d ? "border-primary bg-teal-50 dark:bg-teal-950/30" : "border-border",
                ].join(" ")}
              />
            ))}
          </div>
        </fieldset>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending || !codeComplet || !email}>
          {pending ? <><Spinner size="sm" /> Verification...</> : "Valider le code"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Pas recu le code, ou code expire ?{" "}
        <button
          type="button"
          className="text-primary hover:underline font-medium disabled:opacity-60"
          onClick={renvoyerCode}
          disabled={renvoiEnCours}
        >
          {renvoiEnCours ? "Envoi..." : "Renvoyer un code"}
        </button>
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
