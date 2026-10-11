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
 * Action de terrain fixee au-dessus de la barre basse, sur telephone : la page
 * de detail est longue et l'action utile se retrouvait tout en bas.
 */
export function ActionPrincipaleMobile({ action, distributionId }: Props) {
  if (!action) return null;
  return (
    <>
      {/* Reserve la place de la barre pour que la fin de la page reste visible. */}
      <div className="h-16 lg:hidden" aria-hidden />
      <div
        className="fixed inset-x-0 z-20 border-t border-border/60 bg-background/95 px-4 py-2.5 backdrop-blur-md lg:hidden"
        style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {action === "pointage" ? (
          <Link href={`/distributions/${distributionId}/pointage`} className={cn(buttonVariants(), "h-11 w-full")}>
            <ClipboardList className="mr-2 size-4" />
            Ouvrir le pointage
          </Link>
        ) : (
          <a href="#mon-inscription" className={cn(buttonVariants(), "h-11 w-full")}>
            <UserPlus className="mr-2 size-4" />
            S&apos;inscrire à cette distribution
          </a>
        )}
      </div>
    </>
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
