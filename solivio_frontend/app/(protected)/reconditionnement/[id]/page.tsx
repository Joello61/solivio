import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, Clock, MapPin, Users, AlertCircle } from "lucide-react";
import { SessionActions } from "@/components/reconditionnement/SessionActions";
import { StatutBadge } from "@/components/reconditionnement/StatutBadge";
import { ListeInscritsReco } from "@/components/reconditionnement/ListeInscritsReco";
import { CarteEmplacement } from "@/components/shared/CarteEmplacement";
import type { SessionReconditionnementResponse, InscriptionReconditionnementResponse } from "@/types/reconditionnement";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Session de reconditionnement" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchData(id: string, cookieHeader: string) {
  const base = process.env.API_URL ?? "http://localhost:8080";
  const h = { Cookie: cookieHeader };

  const [sessionRes, meRes] = await Promise.all([
    fetch(`${base}/api/sessions-reconditionnement/${id}`, { headers: h, cache: "no-store" }),
    fetch(`${base}/api/auth/me`, { headers: h, cache: "no-store" }),
  ]);

  if (!sessionRes.ok) return null;

  const session = (await sessionRes.json()) as SessionReconditionnementResponse;
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  const inscritsRes = estGestionnaire
    ? await fetch(`${base}/api/sessions-reconditionnement/${id}/inscrits`, {
        headers: h,
        cache: "no-store",
      })
    : null;

  const inscrits =
    inscritsRes?.ok
      ? ((await inscritsRes.json()) as InscriptionReconditionnementResponse[])
      : [];

  return { session, me, inscrits };
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const data = await fetchData(id, cookieHeader);
  if (!data) notFound();

  const { session, me, inscrits } = data;

  const estResponsable = me?.roles.some((r) => ["responsable", "super_admin"].includes(r));
  const estCoordinateur = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* En-tete */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground font-display">{session.titre}</h1>
        <StatutBadge statut={session.statut} />
      </div>

      {session.motifAnnulation && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {session.motifAnnulation}
        </div>
      )}

      {/* Informations */}
      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="size-4 shrink-0 text-muted-foreground" />
          <span>
            <span className="font-medium text-foreground">Début :</span>{" "}
            <span className="text-muted-foreground">{formatDateTime(session.dateHeureDebut)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span>
            <span className="font-medium text-foreground">Fin :</span>{" "}
            <span className="text-muted-foreground">{formatDateTime(session.dateHeureFin)}</span>
          </span>
        </div>
        {session.lieu?.adresseFormatee && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{session.lieu.adresseFormatee}</span>
          </div>
        )}
        {session.lieu?.latitude != null && session.lieu?.longitude != null && (
          <CarteEmplacement
            lieu={{
              latitude: session.lieu.latitude,
              longitude: session.lieu.longitude,
              adresseFormatee: session.lieu.adresseFormatee,
            }}
            interactive={true}
          />
        )}
        <div className="flex items-center gap-2 text-sm">
          <Users className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            {session.nbInscrits} inscrit{session.nbInscrits !== 1 ? "s" : ""}
            {session.capacite != null ? ` / ${session.capacite} places` : ""}
          </span>
        </div>
        {session.description && (
          <p className="text-sm text-muted-foreground pt-1 border-t border-border/40">
            {session.description}
          </p>
        )}
      </div>

      {/* Inscrits et pointage (coordinateur) */}
      {estCoordinateur && inscrits.length >= 0 && (
        <ListeInscritsReco
          sessionId={id}
          inscrits={inscrits}
          statut={session.statut}
          estCoordinateur={!!estCoordinateur}
        />
      )}

      {/* Actions */}
      <SessionActions
        sessionId={id}
        statut={session.statut}
        estResponsable={!!estResponsable}
        estCoordinateur={!!estCoordinateur}
      />
    </div>
  );
}
