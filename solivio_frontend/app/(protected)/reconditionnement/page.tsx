import Link from "next/link";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import { Plus, PackageX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionReconditionnementCard } from "@/components/reconditionnement/SessionReconditionnementCard";
import type { SessionReconditionnementResponse } from "@/types/reconditionnement";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Reconditionnement" };

async function fetchData(): Promise<{
  me: MeResponse | null;
  sessions: SessionReconditionnementResponse[];
}> {
  const [me, sessions] = await Promise.all([
    lireMoi(),
    lireServeur<SessionReconditionnementResponse[]>("/api/sessions-reconditionnement"),
  ]);
  return { me, sessions: sessions ?? [] };
}

export default async function ReconditionnementPage() {
  const { me, sessions } = await fetchData();

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Reconditionnement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {estGestionnaire
              ? "Gérez les sessions de reconditionnement de l'association."
              : "Consultez et inscrivez-vous aux sessions disponibles."}
          </p>
        </div>
        {me?.roles.some((r) => ["responsable", "super_admin"].includes(r)) && (
          <Link href="/reconditionnement/nouvelle" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-2 size-4" />
            Nouvelle session
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <EmptyState
            icon={PackageX}
            title="Aucune session"
            description={
              estGestionnaire
                ? "Aucune session de reconditionnement n'a été créée."
                : "Aucune session n'est disponible pour le moment."
            }
            action={
              me?.roles.some((r) => ["responsable", "super_admin"].includes(r))
                ? { label: "Créer une session", href: "/reconditionnement/nouvelle" }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => (
            <SessionReconditionnementCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
