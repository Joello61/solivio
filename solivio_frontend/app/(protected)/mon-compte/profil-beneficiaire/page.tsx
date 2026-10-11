import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import type { ProfilBeneficiaireResponse } from "@/types/profil";
import { FormulaireProfilBeneficiaire } from "@/components/account/FormulaireProfilBeneficiaire";

export const metadata: Metadata = { title: "Mon dossier bénéficiaire" };

async function fetchProfil(
  cookieHeader: string
): Promise<ProfilBeneficiaireResponse | null> {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:8080"}/api/me/profil-beneficiaire`,
    { headers: { Cookie: cookieHeader }, cache: "no-store" }
  );
  if (res.status === 403) return null;
  return res.ok ? (res.json() as Promise<ProfilBeneficiaireResponse>) : null;
}

export default async function ProfilBeneficiairePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const profil = await fetchProfil(cookieHeader);
  if (profil === null) redirect("/mon-compte");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/mon-compte"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Mon compte
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Dossier bénéficiaire</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ces informations sont confidentielles et ne sont pas visibles lors du pointage.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6">
        <FormulaireProfilBeneficiaire profil={profil} />
      </div>
    </div>
  );
}
