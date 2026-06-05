"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyEmail } from "@/lib/auth";

/**
 * Saisie du code a 6 chiffres envoye par email lors de l'inscription.
 * Chaque chiffre occupe un champ separe pour une meilleure UX.
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (code.length !== 6) return;
    setError(null);
    setPending(true);
    try {
      await verifyEmail(email, code);
      router.push("/login?verified=1");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? (err as { detail?: string }).detail ?? err.message : "Code invalide ou expire";
      setError(msg);
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Verifiez votre email"
      description={email ? `Code envoye a ${email}` : "Entrez le code a 6 chiffres recu par email."}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <Input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-10 text-center text-xl font-mono p-0"
              aria-label={`Chiffre ${i + 1}`}
            />
          ))}
        </div>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={pending || digits.join("").length !== 6}>
          {pending ? "Verification..." : "Valider"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Pas recu le code ?{" "}
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={async () => {
            if (!email) return;
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: "000000" }),
              });
            } catch {}
          }}
        >
          Renvoyer
        </button>
      </p>
    </AuthLayout>
  );
}
