import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, MapPin, Truck, User, Users } from "lucide-react";
import { StatutBadge } from "@/components/collecte/StatutBadge";
import { MissionActions } from "@/components/collecte/MissionActions";
import type { MissionCollecteResponse } from "@/types/collecte";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Detail mission collecte" };

async function fetchData(id: string, cookieHeader: string): Promise<{
  me: MeResponse | null;
  mission: MissionCollecteResponse | null;
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const [meRes, missionRes] = await Promise.all([
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/missions-collecte/${id}`, { headers, cache: "no-store" }),
  ]);

  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const mission = missionRes.ok ? ((await missionRes.json()) as MissionCollecteResponse) : null;
  return { me, mission };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetailMissionCollectePage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const { me, mission } = await fetchData(id, cookieHeader);

  if (!mission) notFound();

  const estGestionnaire = me?.roles.some((r) =>
    ["admin", "coordinateur", "responsable", "super_admin"].includes(r),
  ) ?? false;
  const estBenevole = me?.roles.includes("benevole") ?? false;
  const meId = me?.id ?? null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <h1 className="text-3xl font-bold text-foreground font-display flex-1">{mission.titre}</h1>
          <StatutBadge statut={mission.statut} />
        </div>
        {mission.description && (
          <p className="text-sm text-muted-foreground">{mission.description}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="size-4 text-muted-foreground shrink-0" />
          <span>
            {new Date(mission.dateHeure).toLocaleString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {mission.lieuCollecte?.adresseFormatee && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <span>Collecte : {mission.lieuCollecte.adresseFormatee}</span>
          </div>
        )}

        {mission.lieuDepot?.adresseFormatee && (
          <div className="flex items-center gap-3 text-sm">
            <Truck className="size-4 text-muted-foreground shrink-0" />
            <span>Depot : {mission.lieuDepot.adresseFormatee}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <Users className="size-4 text-muted-foreground shrink-0" />
          <span>{mission.capacitePersonnes} benevole{mission.capacitePersonnes > 1 ? "s" : ""} max.</span>
        </div>

        {mission.benevoleNomComplet && (
          <div className="flex items-center gap-3 text-sm">
            <User className="size-4 text-muted-foreground shrink-0" />
            <span>Assigne a : {mission.benevoleNomComplet}</span>
          </div>
        )}

        {mission.raisonAnnulation && (
          <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            Raison : {mission.raisonAnnulation}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Historique</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          {mission.datePriseEnCharge && (
            <li>Prise en charge : {new Date(mission.datePriseEnCharge).toLocaleString("fr-FR")}</li>
          )}
          {mission.dateCollecteEffectuee && (
            <li>Collecte effectuee : {new Date(mission.dateCollecteEffectuee).toLocaleString("fr-FR")}</li>
          )}
          {mission.dateDepotValide && (
            <li>Depot valide : {new Date(mission.dateDepotValide).toLocaleString("fr-FR")}</li>
          )}
        </ol>
      </div>

      <MissionActions
        missionId={mission.id}
        statut={mission.statut}
        benevoleId={mission.benevoleId}
        meId={meId}
        estGestionnaire={estGestionnaire}
        estBenevole={estBenevole}
      />
    </div>
  );
}
