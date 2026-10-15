import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, CalendarCheck, ShoppingBag, UserPlus } from "lucide-react";
import { datePublique, lieuPublic, ProchainesDistributions } from "@/components/accueil/ProchainesDistributions";
import { Logo } from "@/components/layout/identite";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { lireProchainesDistributions } from "@/lib/api/public";
import { NOM_ASSOCIATION, VILLE_ASSOCIATION } from "@/lib/marque";
import { PHOTOS } from "@/lib/photos";
import { cn } from "@/lib/utils";
import type { DistributionPubliqueResponse } from "@/types/distribution";

export const metadata: Metadata = {
  title: { absolute: NOM_ASSOCIATION },
};

const DEPOT = "https://github.com/Joello61/solivio";

const ETAPES = [
  { icone: UserPlus, titre: "Créez votre compte", texte: "Un nom, une adresse email, un mot de passe. Vous confirmez avec un code reçu par email." },
  { icone: CalendarCheck, titre: "Choisissez une date et un horaire", texte: "S'il n'y a plus de place, vous passez en liste d'attente et on vous prévient dès qu'une place se libère." },
  { icone: ShoppingBag, titre: "Venez avec un sac", texte: "Un rappel arrive la veille. Sur place, on vous accueille par votre nom, rien d'autre." },
];

const TITRE_SECTION = "font-display text-3xl font-extrabold tracking-tight sm:text-4xl";

/* La prochaine date, posee sur la photo d'ouverture. */
function CarteProchaine({ distribution }: { distribution: DistributionPubliqueResponse }) {
  const { jour, numero, mois, complete } = datePublique(distribution);
  return (
    <div className="absolute inset-x-3 -bottom-10 flex items-center gap-4 rounded-2xl bg-card p-4 text-card-foreground shadow-lg sm:inset-x-6">
      <span className="sr-only">{complete}</span>
      <div aria-hidden="true" className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-night py-2 text-on-night">
        <span className="font-mono text-xs tracking-wider">{jour}</span>
        <span className="font-display text-3xl leading-none font-extrabold text-accent">{numero}</span>
        <span className="font-mono text-xs tracking-wider">{mois}</span>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-bold text-info">Prochaine distribution</span>
        {distribution.heureDebut && distribution.heureFin && (
          <span className="font-display text-xl font-extrabold tabular-nums">
            {distribution.heureDebut.slice(0, 5)} - {distribution.heureFin.slice(0, 5)}
          </span>
        )}
        <span className="truncate text-sm text-muted-foreground">{lieuPublic(distribution)}</span>
      </div>
    </div>
  );
}

/* Porte d'entree publique de Linkee Toulouse (ADR-001 : une seule association). */
export default async function Accueil() {
  const magasin = await cookies();
  const connecte = magasin.has("access_token") || magasin.has("refresh_token");
  const distributions = await lireProchainesDistributions();
  const prochaine = distributions?.[0];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-lg bg-card px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg">
            <Logo className="h-11" />
            <span className="font-display text-lg font-bold">{VILLE_ASSOCIATION}</span>
          </Link>
          <nav aria-label="Navigation principale" className="flex items-center gap-2 sm:gap-6">
            <a href="#fonctionnement" className="hidden font-semibold hover:text-primary md:inline">
              Comment ça marche
            </a>
            <a href="#benevole" className="hidden font-semibold hover:text-primary md:inline">
              Devenir bénévole
            </a>
            <Link href={connecte ? "/dashboard" : "/login"} className={buttonVariants({ variant: "outline" })}>
              {connecte ? "Mon espace" : "Se connecter"}
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu" className="flex-1">
        <section aria-labelledby="titre-accueil" className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 pb-20 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pt-16 lg:pb-24">
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground">
              <span aria-hidden="true" className="size-2 rounded-full bg-brand-alt" />
              Association de solidarité étudiante
            </span>
            <h1 id="titre-accueil" className="font-display text-4xl leading-[1.04] font-extrabold tracking-tight sm:text-6xl">
              Des colis alimentaires pour les étudiants,{" "}
              <span className="[box-shadow:inset_0_-0.3em_0_var(--accent)]">sur simple inscription</span>.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Chaque semaine, les bénévoles de Linkee distribuent des denrées sur les campus de Toulouse. Choisissez
              votre créneau en ligne, on vous attend.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={connecte ? "/distributions" : "/register"} className={buttonVariants({ size: "lg" })}>
                {connecte ? "Voir les distributions" : "Je m'inscris"}
                <ArrowRight aria-hidden="true" />
              </Link>
              <a href="#benevole" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Devenir bénévole
              </a>
            </div>
          </div>
          <div className="relative">
            <Image
              src={PHOTOS.equipeSoiree.src}
              alt={PHOTOS.equipeSoiree.alt}
              preload
              placeholder="blur"
              sizes="(min-width: 1024px) 560px, 100vw"
              className="aspect-[4/3] w-full rounded-3xl object-cover"
            />
            {prochaine && <CarteProchaine distribution={prochaine} />}
          </div>
        </section>

        <section aria-labelledby="titre-dates" className="bg-brand text-on-brand">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:px-8 lg:py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <h2 id="titre-dates" className={TITRE_SECTION}>
                  Prochaines distributions
                </h2>
                <p className="text-base">Les places se réservent depuis votre compte, en quelques secondes.</p>
              </div>
              <Link href={connecte ? "/distributions" : "/register"} className={cn(buttonVariants({ variant: "accent" }), "self-start")}>
                Réserver ma place
              </Link>
            </div>
            <ProchainesDistributions distributions={distributions} />
          </div>
        </section>

        <section
          id="fonctionnement"
          aria-labelledby="titre-etapes"
          className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:py-24"
        >
          <div className="flex flex-col gap-7">
            <h2 id="titre-etapes" className={TITRE_SECTION}>
              Comment ça marche
            </h2>
            <ol className="flex flex-col gap-6">
              {ETAPES.map(({ icone: Icone, titre, texte }, i) => (
                <li key={titre} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                      i === ETAPES.length - 1 ? "bg-accent text-accent-foreground" : "bg-brand-alt text-on-brand-alt",
                    )}
                  >
                    <Icone className="size-6" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-lg font-bold">{titre}</h3>
                    <p className="text-base text-muted-foreground">{texte}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">
              Le nombre d&apos;inscriptions par semaine est limité selon les règles de l&apos;association.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Image src={PHOTOS.colis.src} alt={PHOTOS.colis.alt} placeholder="blur" sizes="(min-width: 1024px) 560px, 100vw" className="col-span-2 aspect-video w-full rounded-3xl object-cover" />
            <Image src={PHOTOS.salleDistribution.src} alt={PHOTOS.salleDistribution.alt} placeholder="blur" sizes="(min-width: 1024px) 280px, 50vw" className="aspect-[4/3] w-full rounded-3xl object-cover" />
            <Image src={PHOTOS.camionCollecte.src} alt={PHOTOS.camionCollecte.alt} placeholder="blur" sizes="(min-width: 1024px) 280px, 50vw" className="aspect-[4/3] w-full rounded-3xl object-cover" />
          </div>
        </section>

        <section id="benevole" aria-labelledby="titre-benevole" className="bg-night text-on-night">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:py-24">
            <div className="flex flex-col gap-5 lg:order-2">
              <span className="self-start rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground">Bénévolat</span>
              <h2 id="titre-benevole" className={TITRE_SECTION}>
                Deux heures par semaine, ça change tout.
              </h2>
              <p className="max-w-xl text-lg text-on-night-muted">
                Accueil, préparation des colis, collectes chez nos partenaires : l&apos;équipe vous forme sur place.
                Parlez-en à un responsable lors d&apos;une distribution ; vous recevrez une invitation pour créer votre
                compte bénévole.
              </p>
              <a href="#titre-dates" className={cn(buttonVariants({ size: "lg" }), "self-start bg-brand-alt text-on-brand-alt hover:bg-brand-alt/85")}>
                Voir les prochaines dates
              </a>
            </div>
            <div className="grid grid-cols-2 items-end gap-3.5 lg:order-1">
              <Image src={PHOTOS.benevoleGilet.src} alt={PHOTOS.benevoleGilet.alt} placeholder="blur" sizes="(min-width: 1024px) 280px, 50vw" className="aspect-[3/4] w-full rounded-3xl object-cover" />
              <Image src={PHOTOS.benevoleColis.src} alt={PHOTOS.benevoleColis.alt} placeholder="blur" sizes="(min-width: 1024px) 280px, 50vw" className="mb-9 aspect-[3/4] w-full rounded-3xl object-cover" />
            </div>
          </div>
        </section>

        <section aria-labelledby="titre-vie" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 sm:px-8 lg:py-20">
          <h2 id="titre-vie" className={TITRE_SECTION}>
            {NOM_ASSOCIATION}, ce sont ses bénévoles
          </h2>
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Image src={PHOTOS.equipeHalle.src} alt={PHOTOS.equipeHalle.alt} placeholder="blur" sizes="(min-width: 640px) 760px, 100vw" className="aspect-[16/9] w-full rounded-3xl object-cover sm:col-span-2" />
            <Image src={PHOTOS.equipeSalle.src} alt={PHOTOS.equipeSalle.alt} placeholder="blur" sizes="(min-width: 640px) 380px, 100vw" className="aspect-[16/9] h-full w-full rounded-3xl object-cover" />
          </div>
        </section>
      </main>

      <footer className="bg-night text-on-night-muted">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-12 pb-6 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="flex max-w-sm flex-col gap-3">
              <span className="flex items-center gap-2.5 text-on-night">
                <Logo plaque className="h-11" />
                <span className="font-display text-lg font-bold">{VILLE_ASSOCIATION}</span>
              </span>
              <p>Association de solidarité étudiante : distributions alimentaires, collectes et entraide sur les campus toulousains.</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold text-on-night">Votre espace</span>
              <Link href="/login" className="hover:text-on-night hover:underline">
                Se connecter
              </Link>
              <Link href="/register" className="hover:text-on-night hover:underline">
                Créer un compte
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-on-night/15 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              {NOM_ASSOCIATION} utilise Solivio, logiciel libre sous licence AGPL v3.{" "}
              <a href={DEPOT} className="font-semibold text-on-night hover:underline">
                Code source
              </a>
            </p>
            <ThemeToggle variant="label" className="-ml-3 w-auto shrink-0 text-on-night-muted hover:bg-on-night/10 hover:text-on-night sm:ml-0" />
          </div>
        </div>
      </footer>
    </div>
  );
}
