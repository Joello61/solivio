import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { MeResponse } from "@/types/auth";
import { FormulaireMonCompte } from "@/components/account/FormulaireMonCompte";

export const metadata: Metadata = { title: "Mon compte" };

async function fetchMe(cookieHeader: string): Promise<MeResponse | null> {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:8080"}/api/auth/me`,
    { headers: { Cookie: cookieHeader }, cache: "no-store" }
  );
  return res.ok ? (res.json() as Promise<MeResponse>) : null;
}

export default async function MonComptePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const user = await fetchMe(cookieHeader);
  if (!user) redirect("/login");

  const estBeneficiaire = user.roles.includes("beneficiaire");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mon compte</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gerer vos informations personnelles et votre photo de profil.
        </p>
      </div>

      {estBeneficiaire && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dossier beneficiaire</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completez votre dossier social pour beneficier des distributions.
              </p>
            </div>
            <Link
              href="/mon-compte/profil-beneficiaire"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Voir le dossier
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <FormulaireMonCompte user={user} />
      </div>
    </div>
  );
}
