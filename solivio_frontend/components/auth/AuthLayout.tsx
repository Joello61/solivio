import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/layout/identite";
import { VILLE_ASSOCIATION } from "@/lib/marque";
import { PHOTOS, type Photo } from "@/lib/photos";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  /* Photo du panneau ; une photo de groupe par defaut. */
  photo?: Photo;
  /* Phrase du panneau, sur ordinateur. */
  accroche?: string;
}

const ESPACE = [
  { texte: "Vos rendez-vous et votre billet", puce: "bg-accent" },
  { texte: "Les prochaines distributions", puce: "bg-brand-alt" },
  { texte: "Vos engagements de bénévole", puce: "bg-on-night-muted" },
];

/*
 * Ecrans d'acces : la photo de l'association en panneau sur ordinateur, en
 * bandeau sur telephone, et le formulaire d'abord dans une seule colonne.
 */
export function AuthLayout({ children, title, description, photo = PHOTOS.equipeSalle, accroche = "L'entraide étudiante, à Toulouse." }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <div className="relative h-60 shrink-0 overflow-hidden bg-night sm:h-72 lg:sticky lg:top-0 lg:h-dvh lg:w-[46%]">
        <Image src={photo.src} alt="" preload placeholder="blur" fill sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover opacity-75 lg:opacity-60" />
        <Link href="/" className="absolute top-4 left-4 flex items-center gap-1 rounded-xl bg-on-night pr-3 text-night shadow-md sm:top-6 sm:left-6">
          <Logo plaque className="h-10" />
          <span className="font-display text-lg font-bold">{VILLE_ASSOCIATION}</span>
        </Link>
        <div className="absolute inset-x-8 bottom-8 hidden max-w-md flex-col gap-4 rounded-3xl bg-night p-7 text-on-night lg:flex">
          <p className="font-display text-3xl leading-tight font-extrabold">{accroche}</p>
          <ul className="flex flex-col gap-2 text-on-night-muted">
            {ESPACE.map(({ texte, puce }) => (
              <li key={texte} className="flex items-center gap-2.5">
                <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${puce}`} />
                {texte}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <main id="contenu" className="relative -mt-12 flex flex-1 justify-center px-3 pb-12 sm:px-6 lg:mt-0 lg:items-center lg:px-12 lg:py-12">
        <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-lg sm:p-8 lg:bg-transparent lg:p-0 lg:shadow-none">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
          <div className="mt-7 flex flex-col gap-5">{children}</div>
        </div>
      </main>
    </div>
  );
}
