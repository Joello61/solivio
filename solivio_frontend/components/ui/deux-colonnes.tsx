import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  /* Colonne de droite sur ordinateur, sous le contenu sur telephone. */
  aside?: ReactNode;
  /* Garde la colonne visible au defilement (aide d'un formulaire, apercu). */
  collante?: boolean;
  /* Sur telephone, la colonne passe avant le contenu (resultat d'un calcul plutot que sa saisie). */
  asideEnTete?: boolean;
  className?: string;
}

/*
 * Mise en page d'une page sur ordinateur : le contenu, et a droite ce qui
 * l'accompagne (rendez-vous, aide, apercu) plutot qu'une marge vide.
 */
export function DeuxColonnes({ children, aside, collante = false, asideEnTete = false, className }: Props) {
  if (!aside) return <div className={cn("flex min-w-0 flex-col gap-6", className)}>{children}</div>;
  return (
    <div className={cn("grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem]", className)}>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <aside className={cn("flex min-w-0 flex-col gap-4", collante && "lg:sticky lg:top-6", asideEnTete && "order-first lg:order-none")}>{aside}</aside>
    </div>
  );
}
