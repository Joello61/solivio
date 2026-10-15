"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { EtatPage } from "@/components/layout/EtatPage";

interface PageErreurProps {
  error: Error & { digest?: string };
  retry: () => void;
  retour: string;
  libelleRetour: string;
}

/*
 * Erreur inattendue d'un segment. Le message technique n'est jamais affiche ; la
 * reference (digest) permet de retrouver l'erreur dans les journaux du serveur.
 */
export function PageErreur({ error, retry, retour, libelleRetour }: PageErreurProps) {
  return (
    <EtatPage
      titre="Cette page n'a pas pu s'afficher"
      message={
        <>
          <p>Un problème est survenu de notre côté. Réessayez dans un instant ; si cela continue, prévenez l&apos;équipe.</p>
          {error.digest && <p className="mt-3 font-mono text-sm">Référence : {error.digest}</p>}
        </>
      }
    >
      <Button onClick={() => retry()}>Réessayer</Button>
      <Link href={retour} className={buttonVariants({ variant: "outline" })}>
        {libelleRetour}
      </Link>
    </EtatPage>
  );
}
