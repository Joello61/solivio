"use client";

import { usePathname, useRouter } from "next/navigation";
import { SegmentedControl, type OptionSegment } from "@/components/ui/segmented-control";

interface Props<T extends string> {
  /* Parametre d'adresse qui porte le choix ; la valeur par defaut n'y figure pas. */
  parametre: string;
  valeur: T;
  defaut: T;
  options: OptionSegment<T>[];
  label: string;
}

/* Filtre segmente porte par l'adresse : le choix survit au retour depuis une fiche. */
export function FiltreUrl<T extends string>({ parametre, valeur, defaut, options, label }: Props<T>) {
  const router = useRouter();
  const chemin = usePathname();
  return (
    <SegmentedControl
      label={label}
      value={valeur}
      options={options}
      onValueChange={(v) => router.replace(v === defaut ? chemin : `${chemin}?${parametre}=${v}`, { scroll: false })}
    />
  );
}
