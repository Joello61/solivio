import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, PackageX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionReconditionnementCard } from "@/components/reconditionnement/SessionReconditionnementCard";
import type { SessionReconditionnementResponse } from "@/types/reconditionnement";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Reconditionnement" };

async function fetchData(cookieHeader: string): Promise<{
  me: MeResponse | null;
  sessions: SessionReconditionnementResponse[];
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const [meRes, sessionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/sessions-reconditionnement`, { headers, cache: "no-store" }),
  ]);

  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const sessions = sessionsRes.ok
    ? ((await sessionsRes.json()) as SessionReconditionnementResponse[])
    : [];

  return { me, sessions };
}

export default async function ReconditionnementPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { me, sessions } = await fetchData(cookieHeader);

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
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm">
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
