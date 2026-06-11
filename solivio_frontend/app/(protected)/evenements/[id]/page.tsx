import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, Clock, MapPin, Users, UserCheck, ClipboardList } from "lucide-react";
import { StatutBadge } from "@/components/evenement/StatutBadge";
import { EvenementActions } from "@/components/evenement/EvenementActions";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Detail evenement" };

const LABEL_TYPE: Record<string, string> = {
  STAND: "Stand",
  FETE: "Fete",
  AUTRE: "Evenement",
};

async function fetchData(id: string, cookieHeader: string) {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };
  const [evRes, meRes] = await Promise.all([
    fetch(`${baseUrl}/api/evenements/${id}`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
  ]);
  const evenement = evRes.ok ? ((await evRes.json()) as EvenementResponse) : null;
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;

  let mesParticipations: ParticipationEvenementResponse[] = [];
  if (me) {
    const mesEvRes = await fetch(`${baseUrl}/api/evenements/mes-evenements`, {
      headers,
      cache: "no-store",
    });
    mesParticipations = mesEvRes.ok
      ? ((await mesEvRes.json()) as ParticipationEvenementResponse[])
      : [];
  }
  return { evenement, me, mesParticipations };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetailEvenementPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const { evenement, me, mesParticipations } = await fetchData(id, cookieHeader);

  if (!evenement) notFound();

  const estGestionnaire =
    me?.roles.some((r) => ["admin", "coordinateur", "responsable", "super_admin"].includes(r)) ??
    false;
  const estBenevole = me?.roles.includes("benevole") ?? false;
  const estBeneficiaire = me?.roles.includes("beneficiaire") ?? false;
  const dejaInscrit = mesParticipations.some((p) => p.evenementId === id);

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {LABEL_TYPE[evenement.type] ?? evenement.type}
            </p>
            <h1 className="text-3xl font-bold text-foreground font-display">{evenement.titre}</h1>
          </div>
          <StatutBadge statut={evenement.statut} />
        </div>
        {evenement.description && (
          <p className="text-sm text-muted-foreground">{evenement.description}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="size-4 text-muted-foreground shrink-0" />
          <span>
            {new Date(evenement.dateHeureDebut).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="size-4 text-muted-foreground shrink-0" />
          <span>
            {new Date(evenement.dateHeureDebut).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {new Date(evenement.dateHeureFin).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {evenement.lieuAdresseFormatee && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <span>{evenement.lieuAdresseFormatee}</span>
          </div>
        )}
        {evenement.aBesoiNStaff && (
          <div className="flex items-center gap-3 text-sm">
            <UserCheck className="size-4 text-muted-foreground shrink-0" />
            <span>
              Staff : {evenement.nbStaff}
              {evenement.capaciteStaff ? ` / ${evenement.capaciteStaff}` : ""} benevoles
            </span>
          </div>
        )}
        {evenement.ouvertParticipants && (
          <div className="flex items-center gap-3 text-sm">
            <Users className="size-4 text-muted-foreground shrink-0" />
            <span>
              Participants : {evenement.nbParticipants}
              {evenement.capaciteParticipants ? ` / ${evenement.capaciteParticipants}` : ""}
              {evenement.publicParticipants ? ` (${evenement.publicParticipants.toLowerCase()})` : ""}
            </span>
          </div>
        )}
        {evenement.modeInscription && (
          <div className="flex items-center gap-3 text-sm">
            <ClipboardList className="size-4 text-muted-foreground shrink-0" />
            <span>
              Mode : {evenement.modeInscription === "OBLIGATOIRE"
                ? "Inscription obligatoire"
                : evenement.modeInscription === "LIBRE"
                  ? "Inscription libre"
                  : "Sans inscription"}
            </span>
          </div>
        )}
        {evenement.raisonAnnulation && (
          <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            Raison : {evenement.raisonAnnulation}
          </div>
        )}
      </div>

      <EvenementActions
        evenementId={evenement.id}
        statut={evenement.statut}
        aBesoiNStaff={evenement.aBesoiNStaff}
        ouvertParticipants={evenement.ouvertParticipants}
        modeInscription={evenement.modeInscription}
        estGestionnaire={estGestionnaire}
        estBenevole={estBenevole}
        estBeneficiaire={estBeneficiaire}
        dejaInscrit={dejaInscrit}
      />
    </div>
  );
}
