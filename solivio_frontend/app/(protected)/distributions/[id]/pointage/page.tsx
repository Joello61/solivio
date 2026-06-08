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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/distributions/${id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Retour a la distribution"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Pointage</h1>
            <p className="text-xs text-muted-foreground">
              Recherchez un inscrit par nom ou prenom. Aucune donnee sensible n&apos;est affichee.
            </p>
          </div>
        </div>
      </div>

      <PointageListe distributionId={id} />
    </div>
  );
}
