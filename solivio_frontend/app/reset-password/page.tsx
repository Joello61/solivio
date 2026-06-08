"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { resetPassword } from "@/lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
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
    if (code.length !== 6) { setError("Code incomplet"); return; }
    if (nouveauMotDePasse !== confirmation) { setError("Les mots de passe ne correspondent pas"); return; }
    setError(null);
    setPending(true);
    try {
      await resetPassword(email, code, nouveauMotDePasse);
      router.push("/login?reset=1");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? (err as { detail?: string }).detail ?? err.message : "Erreur";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  const codeComplet = digits.join("").length === 6;

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      description={email ? `Code envoye a ${email}` : "Entrez le code recu par email."}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Code de verification</Label>
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Chiffre ${i + 1}`}
                className={[
                  "h-12 w-10 rounded-xl border-2 bg-card text-center text-lg font-bold font-mono",
                  "text-foreground caret-transparent transition-all",
                  "focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
                  d ? "border-primary/60 bg-primary/5" : "border-border",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <PasswordInput
            id="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            placeholder="8 caracteres minimum"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <PasswordInput
            id="confirm"
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Repetez votre mot de passe"
          />
        </div>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending || !codeComplet}>
          {pending ? (
            <><Spinner size="sm" /> Modification...</>
          ) : (
            "Modifier le mot de passe"
          )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
