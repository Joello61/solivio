import type { Metadata } from "next";
import { accesServeur, lireMoi } from "@/lib/api/serveur";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PointageListe } from "@/components/pointage/PointageListe";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Pointage" };

interface PageProps {
  params: Promise<{ id: string }>;
}

// Le backend repond 404 a qui n'a pas acces au pointage de cette distribution
// (benevole non inscrit) : la page s'affiche alors comme introuvable.
async function chargerAcces(id: string): Promise<{ me: MeResponse | null; autorise: boolean }> {
  const [me, autorise] = await Promise.all([lireMoi(), accesServeur(`/api/distributions/${id}/pointage?q=`)]);
  return { me, autorise };
}

export default async function PointagePage({ params }: PageProps) {
  const { id } = await params;
  const { me, autorise } = await chargerAcces(id);
  if (!autorise) notFound();
  // Le pointage ad hoc (visiteurs, benevoles non inscrits) est reserve aux gestionnaires.
  const peutAjouter = estGestionnaireDistribution(me?.roles ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/distributions/${id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Retour à la distribution"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">Pointage</h1>
            <p className="text-xs text-muted-foreground">
              Touchez Présent ou Absent pour chaque inscrit. Aucune donnée sensible n&apos;est affichée.
            </p>
          </div>
        </div>
      </div>

      <PointageListe distributionId={id} peutAjouter={peutAjouter} />
    </div>
  );
}
