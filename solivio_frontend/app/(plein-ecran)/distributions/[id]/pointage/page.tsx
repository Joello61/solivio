import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JourJ } from "@/components/pointage/JourJ";
import { dateLongue } from "@/lib/agenda";
import { accesServeur, lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import type { DistributionResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Jour J" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PointagePage({ params }: PageProps) {
  const { id } = await params;
  // Le backend repond 404 a qui n'a pas acces au pointage de cette distribution
  // (benevole non inscrit) : la page s'affiche alors comme introuvable.
  const [me, autorise, distribution] = await Promise.all([
    lireMoi(),
    accesServeur(`/api/distributions/${id}/pointage?q=`),
    lireServeur<DistributionResponse>(`/api/distributions/${id}`),
  ]);
  if (!autorise || !distribution) notFound();
  const jour = dateLongue(distribution.date);

  // Plein ecran, sans navigation : le jour J n'a besoin que de la liste.
  return (
    <main className="min-h-dvh bg-background">
      <JourJ
        distributionId={id}
        jour={jour.charAt(0).toUpperCase() + jour.slice(1)}
        peutGerer={estGestionnaireDistribution(me?.roles ?? [])}
        close={distribution.statut === "TERMINEE"}
      />
    </main>
  );
}
