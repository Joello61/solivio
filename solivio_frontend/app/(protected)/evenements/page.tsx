import Link from "next/link";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estResponsable } from "@/lib/roles";
import type { Metadata } from "next";
import { Plus, CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EvenementCard } from "@/components/evenement/EvenementCard";
import type { EvenementResponse } from "@/types/evenement";

export const metadata: Metadata = { title: "Événements" };

const FILTRES = [
  { label: "Tous", statut: "" },
  { label: "Publies", statut: "PUBLIE" },
  { label: "En cours", statut: "EN_COURS" },
  { label: "Termines", statut: "TERMINE" },
  { label: "Brouillons", statut: "BROUILLON" },
] as const;

async function fetchData(statut: string, type: string) {
  const qs = new URLSearchParams();
  if (statut) qs.set("statut", statut);
  if (type) qs.set("type", type);
  const [evenements, me] = await Promise.all([
    lireServeur<EvenementResponse[]>(`/api/evenements?${qs}`),
    lireMoi(),
  ]);
  return { evenements: evenements ?? [], me };
}

interface Props {
  searchParams: Promise<{ statut?: string; type?: string }>;
}

export default async function EvenementsPage({ searchParams }: Props) {
  const { statut = "", type = "" } = await searchParams;
  const { evenements, me } = await fetchData(statut, type);

  const estGestionnaire =
    me?.roles.some((r) => ["coordinateur", "responsable", "super_admin"].includes(r)) ??
    false;

  // La creation est reservee aux responsables (backend).
  const peutCreer = estResponsable(me?.roles ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Événements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {estGestionnaire
              ? "Gérez et suivez tous les événements de l'association."
              : "Consultez et inscrivez-vous aux événements disponibles."}
          </p>
        </div>
        {peutCreer && (
          <Link href="/evenements/nouveau" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-2 size-4" />
            Nouvel événement
          </Link>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTRES.map((f) => (
          <Link
            key={f.label}
            href={`/evenements${f.statut ? `?statut=${f.statut}` : ""}${type ? `${f.statut ? "&" : "?"}type=${type}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statut === f.statut
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {evenements.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <EmptyState
            icon={CalendarDays}
            title="Aucun événement"
            description={
              estGestionnaire
                ? "Aucun événement n'a été créé. Commencez par en créer un."
                : "Aucun événement n'est disponible pour le moment."
            }
            action={
              peutCreer
                ? { label: "Créer un événement", href: "/evenements/nouveau" }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evenements.map((e) => (
            <EvenementCard key={e.id} evenement={e} />
          ))}
        </div>
      )}
    </div>
  );
}
