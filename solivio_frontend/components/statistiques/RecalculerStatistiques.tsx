"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalculerStatistiques } from "@/lib/api/association";

/** Recalcul des statistiques d'une distribution terminee (pointage corrige apres coup). */
export function RecalculerStatistiques({ distributionId, libelle }: { distributionId: string; libelle: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function recalculer() {
    setEnCours(true);
    setErreur(null);
    try {
      await recalculerStatistiques(distributionId);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Recalcul impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={recalculer}
        disabled={enCours}
        aria-label={`Recalculer les statistiques de ${libelle}`}
        title="Recalculer"
      >
        <RefreshCw className={enCours ? "size-4 animate-spin motion-reduce:animate-none" : "size-4"} />
      </Button>
      {erreur && (
        <span role="alert" className="text-xs text-destructive">
          {erreur}
        </span>
      )}
    </div>
  );
}
