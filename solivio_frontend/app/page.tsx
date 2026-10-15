import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ProchainesDistributions } from "@/components/accueil/ProchainesDistributions";
import { Logo } from "@/components/layout/identite";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { lireProchainesDistributions } from "@/lib/api/public";
import { NOM_ASSOCIATION } from "@/lib/marque";

export const metadata: Metadata = {
  title: { absolute: NOM_ASSOCIATION },
};

const DEPOT = "https://github.com/Joello61/solivio";

const ETAPES = [
  { titre: "Créez votre compte", texte: "Un nom, une adresse email, un mot de passe. Vous confirmez l'adresse avec un code." },
  { titre: "Choisissez une date", texte: "Puis votre horaire. S'il n'y a plus de place, vous passez en liste d'attente." },
  { titre: "Venez au rendez-vous", texte: "Vous recevez une confirmation et un rappel par email. On vous accueille sur place." },
];

/* Porte d'entree publique de l'association (ADR-001 : une seule association). */
export default async function Accueil() {
  const magasin = await cookies();
  const connecte = magasin.has("access_token") || magasin.has("refresh_token");
  const distributions = await lireProchainesDistributions();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-lg bg-card px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
        <span className="flex items-center gap-2.5 font-display text-lg font-bold text-foreground">
          <Logo />
          {NOM_ASSOCIATION}
        </span>
        <Link href={connecte ? "/dashboard" : "/login"} className={buttonVariants({ variant: "ghost" })}>
          {connecte ? "Mon espace" : "Se connecter"}
        </Link>
      </header>

      <main id="contenu" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 pb-20 pt-8 sm:px-8 sm:pt-16">
        <section className="flex max-w-2xl flex-col gap-5">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Les distributions alimentaires de {NOM_ASSOCIATION}, sur inscription.
          </h1>
          <p className="text-lg text-muted-foreground">
            Association de solidarité étudiante. Inscrivez-vous en ligne à une distribution, choisissez votre
            horaire, et recevez votre confirmation par email.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {connecte ? (
              <Link href="/distributions" className={buttonVariants({ size: "lg" })}>
                Voir les distributions
              </Link>
            ) : (
              <>
                <Link href="/register" className={buttonVariants({ size: "lg" })}>
                  Créer un compte
                </Link>
                <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  J&apos;ai déjà un compte
                </Link>
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="titre-dates" className="flex flex-col gap-4">
          <h2 id="titre-dates" className="font-display text-2xl font-bold text-foreground">
            Prochaines distributions
          </h2>
          <ProchainesDistributions distributions={distributions} />
          <p className="text-sm text-muted-foreground">
            Les places se réservent depuis votre compte. Le nombre d&apos;inscriptions par semaine est limité
            selon les règles de l&apos;association.
          </p>
        </section>

        <section aria-labelledby="titre-etapes" className="flex flex-col gap-6">
          <h2 id="titre-etapes" className="font-display text-2xl font-bold text-foreground">
            Comment ça marche
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {ETAPES.map((etape, i) => (
              <li key={etape.titre} className="flex flex-col gap-2 border-t-2 border-primary pt-4">
                <span className="font-mono text-sm font-semibold text-primary">0{i + 1}</span>
                <h3 className="font-display text-lg font-bold text-foreground">{etape.titre}</h3>
                <p className="text-base text-muted-foreground">{etape.texte}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="titre-benevole" className="flex flex-col gap-3 rounded-2xl bg-secondary px-6 py-6 sm:px-8">
          <h2 id="titre-benevole" className="font-display text-2xl font-bold text-secondary-foreground">
            Devenir bénévole
          </h2>
          <p className="max-w-2xl text-base text-foreground">
            Les bénévoles rejoignent l&apos;équipe sur invitation d&apos;un responsable. Parlez-en à l&apos;équipe lors
            d&apos;une distribution : vous recevrez un lien par email pour créer votre compte.
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            {NOM_ASSOCIATION} utilise Solivio, logiciel libre sous licence AGPL v3.{" "}
            <a href={DEPOT} className="font-semibold text-primary hover:underline">
              Code source
            </a>
          </p>
          <ThemeToggle variant="label" className="-ml-3 w-auto shrink-0 sm:ml-0" />
        </div>
      </footer>
    </div>
  );
}
