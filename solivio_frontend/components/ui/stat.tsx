import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  valeur: ReactNode;
  libelle: string;
  detail?: ReactNode;
  className?: string;
}

/* Un chiffre et ce qu'il compte. Plusieurs Stat se posent en ligne, sans carte chacune. */
export function Stat({ valeur, libelle, detail, className }: StatProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="font-display text-3xl leading-none font-extrabold text-foreground tabular-nums">
        {valeur}
      </span>
      <span className="text-base text-foreground">{libelle}</span>
      {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
    </div>
  );
}
