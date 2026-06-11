import { cookies } from "next/headers";
import type { Metadata } from "next";
import { FormulaireConfiguration } from "@/components/association/FormulaireConfiguration";
import type { AssociationResponse } from "@/types/association";

export const metadata: Metadata = { title: "Configuration de l'association" };

async function fetchAssociation(cookieHeader: string): Promise<AssociationResponse | null> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${baseUrl}/api/association`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<AssociationResponse>;
  } catch {
    return null;
  }
}

export default async function ConfigurationPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const association = await fetchAssociation(cookieHeader);

  if (!association) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground font-display">Configuration</h1>
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Impossible de charger la configuration de l&apos;association.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parametres de l&apos;association {association.nom}.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6">
        <FormulaireConfiguration association={association} />
      </div>
    </div>
  );
}
