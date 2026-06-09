"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Building2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
  const [tenants] = useState<TenantSummary[]>(readTenantsFromSession);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      description="Vous etes membre de plusieurs associations. Selectionnez celle dans laquelle vous souhaitez vous connecter."
    >
      <div className="space-y-2">
        {tenants.map((t) => (
          <button
            key={t.slug}
            onClick={() => selectTenant(t.slug)}
            disabled={pending !== null}
            className="group w-full flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-card-foreground truncate">{t.nom}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs font-normal">
                  {ROLE_LABELS[t.role] ?? t.role}
                </Badge>
                {t.coordoType && (
                  <span className="text-xs text-muted-foreground">{t.coordoType}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
              {pending === t.slug ? (
                <Spinner size="sm" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>
        ))}
      </div>

      <FormError message={error} />
    </AuthLayout>
  );
}
