"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Badge } from "@/components/ui/badge";
import { switchTenant } from "@/lib/auth";
import type { TenantSummary } from "@/types/auth";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  responsable: "Responsable",
  coordinateur: "Coordinateur",
  benevole: "Benevole",
  beneficiaire: "Beneficiaire",
};

/**
 * Lit sessionStorage apres le montage (indisponible cote serveur)
 * sans appeler setState dans l'effet - on initialise l'etat
 * a partir du storage juste avant le premier rendu cote client.
 */
function readTenantsFromSession(): TenantSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem("pending_tenants");
    return raw ? (JSON.parse(raw) as TenantSummary[]) : [];
  } catch {
    return [];
  }
}

export default function TenantSelectPage() {
  const router = useRouter();
  // Initialisation paresseuse : evite setState dans useEffect.
  const [tenants] = useState<TenantSummary[]>(readTenantsFromSession);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirige si la session est vide (acces direct a la page).
  useEffect(() => {
    if (tenants.length === 0) {
      router.replace("/login");
    }
  }, [tenants, router]);

  async function selectTenant(slug: string) {
    setPending(slug);
    setError(null);
    try {
      await switchTenant(slug);
      sessionStorage.removeItem("pending_token");
      sessionStorage.removeItem("pending_tenants");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? (err as { detail?: string }).detail ?? err.message
          : "Erreur";
      setError(msg);
      setPending(null);
    }
  }

  if (tenants.length === 0) return null;

  return (
    <AuthLayout
      title="Choisir votre association"
      description="Vous etes membre de plusieurs associations. Laquelle souhaitez-vous rejoindre ?"
    >
      <div className="space-y-2">
        {tenants.map((t) => (
          <button
            key={t.slug}
            onClick={() => selectTenant(t.slug)}
            disabled={pending !== null}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:border-primary hover:bg-foret-50 transition-colors disabled:opacity-50"
          >
            <div>
              <p className="font-medium text-card-foreground">{t.nom}</p>
              <p className="text-sm text-muted-foreground">
                {ROLE_LABELS[t.role] ?? t.role}
                {t.coordoType ? ` - ${t.coordoType}` : ""}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {pending === t.slug ? "..." : t.slug}
            </Badge>
          </button>
        ))}
      </div>

      <FormError message={error} />
    </AuthLayout>
  );
}
