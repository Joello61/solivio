import { redirect } from "next/navigation";
import { lireServeur } from "@/lib/api/serveur";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import type { ProfilBeneficiaireResponse } from "@/types/profil";
import { FormulaireProfilBeneficiaire } from "@/components/account/FormulaireProfilBeneficiaire";

export const metadata: Metadata = { title: "Mon dossier bénéficiaire" };


export default async function ProfilBeneficiairePage() {
  const profil = await lireServeur<ProfilBeneficiaireResponse>("/api/me/profil-beneficiaire");
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

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6">
        <FormulaireProfilBeneficiaire profil={profil} />
      </div>
    </div>
  );
}
