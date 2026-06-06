import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PointageListe } from "@/components/pointage/PointageListe";

export const metadata: Metadata = { title: "Pointage" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PointagePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/distributions/${id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pointage</h1>
          <p className="text-sm text-muted-foreground">
            Recherchez un inscrit par nom ou prenom pour pointer sa presence.
            Aucune donnee sensible n&apos;est affichee ici.
          </p>
        </div>
      </div>

      <PointageListe distributionId={id} />
    </div>
  );
}
