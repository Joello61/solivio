import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface EtatPageProps {
  titre: string;
  message: ReactNode;
  children?: ReactNode;
}

/* Page d'etat (introuvable, erreur) : ce qui se passe, puis quoi faire. */
export function EtatPage({ titre, message, children }: EtatPageProps) {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-lg flex-col justify-center gap-4 px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{titre}</h1>
      <div className="text-base text-muted-foreground">{message}</div>
      {children && <div className="mt-2 flex flex-col gap-3 sm:flex-row">{children}</div>}
    </div>
  );
}

/*
 * La page par defaut de Next.js suit le theme du systeme et non celui choisi dans
 * l'application : son texte devenait illisible en sombre.
 */
export function PageIntrouvable({ retour, libelleRetour }: { retour: string; libelleRetour: string }) {
  return (
    <EtatPage
      titre="Page introuvable"
      message="Cette page n'existe pas, ou vous n'y avez pas accès. Le lien a peut-être changé."
    >
      <Link href={retour} className={buttonVariants()}>
        {libelleRetour}
      </Link>
    </EtatPage>
  );
}
