import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TonStat = "marque" | "turquoise" | "jaune";

const PASTILLE: Record<TonStat, string> = {
  marque: "bg-secondary text-secondary-foreground",
  turquoise: "bg-brand-alt text-on-brand-alt",
  jaune: "bg-accent text-accent-foreground",
};

interface StatProps {
  valeur: ReactNode;
  libelle: string;
  detail?: ReactNode;
  /* Pastille d'icone a gauche du chiffre : un repere pour parcourir une ligne de chiffres. */
  icone?: LucideIcon;
  ton?: TonStat;
  className?: string;
}

/* Un chiffre et ce qu'il compte. Plusieurs Stat se posent en ligne, sans carte chacune. */
export function Stat({ valeur, libelle, detail, icone: Icone, ton = "marque", className }: StatProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3.5", className)}>
      {Icone && (
        <span aria-hidden="true" className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", PASTILLE[ton])}>
          <Icone className="size-6" />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-3xl leading-none font-extrabold text-foreground tabular-nums">{valeur}</span>
        <span className="text-base text-foreground">{libelle}</span>
        {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
      </div>
    </div>
  );
}
