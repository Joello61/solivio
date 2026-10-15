"use client";

import { usePathname, useRouter } from "next/navigation";
import { SegmentedControl, type OptionSegment } from "@/components/ui/segmented-control";

export type VueMissions = "disponibles" | "miennes" | "passees";

/* Filtre porte par l'adresse : la vue choisie survit au retour depuis une fiche. */
export function FiltreMissions({ vue, options }: { vue: VueMissions; options: OptionSegment<VueMissions>[] }) {
  const router = useRouter();
  const chemin = usePathname();
  return (
    <SegmentedControl
      label="Missions à afficher"
      value={vue}
      options={options}
      onValueChange={(v) => router.replace(v === "disponibles" ? chemin : `${chemin}?vue=${v}`, { scroll: false })}
    />
  );
}
