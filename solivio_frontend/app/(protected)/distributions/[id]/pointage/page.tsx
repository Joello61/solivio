import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PointageListe } from "@/components/pointage/PointageListe";

export const metadata: Metadata = { title: "Pointage" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PointagePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/distributions/${id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Retour a la distribution"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-800/40">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">Pointage</h1>
            <p className="text-xs text-muted-foreground">
              Recherchez un inscrit par nom ou prenom. Aucune donnee sensible n&apos;est affichee.
            </p>
          </div>
        </div>
      </div>

      <PointageListe distributionId={id} peutAjouter />
    </div>
  );
}
