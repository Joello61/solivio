"use client";

import { useState } from "react";
import { Map as IconeCarte } from "lucide-react";
import { CarteEmplacement } from "@/components/shared/CarteEmplacement";
import type { PositionLieu } from "@/lib/lieu";

/* Carte repliee par defaut : elle ne charge Google Maps qu'a la demande. */
export function PlanDepliable({ lieu }: { lieu: PositionLieu }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <details
      className="group rounded-xl border border-border bg-card"
      onToggle={(e) => setOuvert(e.currentTarget.open)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-base font-semibold text-primary [&::-webkit-details-marker]:hidden">
        <IconeCarte aria-hidden="true" className="size-5" />
        <span className="group-open:hidden">Voir le plan</span>
        <span className="hidden group-open:inline">Masquer le plan</span>
      </summary>
      {ouvert && (
        <div className="px-4 pb-4">
          <CarteEmplacement lieu={lieu} hauteur="240px" interactive />
        </div>
      )}
    </details>
  );
}
