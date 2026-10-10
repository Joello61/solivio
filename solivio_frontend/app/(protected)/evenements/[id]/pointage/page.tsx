import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PointageEvenementClient } from "./PointageEvenementClient";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";

export const metadata: Metadata = { title: "Pointage événement" };

async function fetchData(id: string, cookieHeader: string) {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };
  const [evRes, pointRes] = await Promise.all([
    fetch(`${baseUrl}/api/evenements/${id}`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/evenements/${id}/pointage`, { headers, cache: "no-store" }),
  ]);
  const evenement = evRes.ok ? ((await evRes.json()) as EvenementResponse) : null;
  const participations = pointRes.ok ? ((await pointRes.json()) as ParticipationEvenementResponse[]) : [];
  return { evenement, participations };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PointageEvenementPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const { evenement, participations } = await fetchData(id, cookieHeader);

  if (!evenement) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Pointage</h1>
        <p className="text-sm text-muted-foreground mt-1">{evenement.titre}</p>
      </div>
      <PointageEvenementClient
        evenementId={id}
        participationsInitiales={participations}
      />
    </div>
  );
}
