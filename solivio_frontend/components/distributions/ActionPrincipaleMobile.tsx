import Link from "next/link";
import { ClipboardList, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ActionPrincipale = "pointage" | "inscription" | null;

interface Props {
  action: ActionPrincipale;
  distributionId: string;
}

/**
 * Action de terrain placee sous le titre, sur telephone : la page de detail est
 * longue et l'action utile se retrouvait tout en bas. Elle reste dans le flux de
 * la page pour ne pas empiler une seconde barre fixe sur la navigation.
 */
export function ActionPrincipaleMobile({ action, distributionId }: Props) {
  if (!action) return null;
  return (
    <div className="lg:hidden">
      {action === "pointage" ? (
        <Link href={`/distributions/${distributionId}/pointage`} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          <ClipboardList aria-hidden="true" />
          Ouvrir le pointage
        </Link>
      ) : (
        <a href="#mon-inscription" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          <UserPlus aria-hidden="true" />
          S&apos;inscrire à cette distribution
        </a>
      )}
    </div>
  );
}

/** Action a mettre en avant, ou null si la page n'en a pas. */
export function actionPrincipale(params: {
  statut: string;
  estGestionnaire: boolean;
  pointageBenevole: boolean;
  peutSInscrire: boolean;
  dejaInscrit: boolean;
}): ActionPrincipale {
  if (params.statut === "EN_COURS" && (params.estGestionnaire || params.pointageBenevole)) return "pointage";
  if (params.statut === "PUBLIEE" && params.peutSInscrire && !params.dejaInscrit) return "inscription";
  return null;
}
