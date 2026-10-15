import type { ReactNode } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

interface Props {
  /* Date du jour, deja mise en forme. */
  surtitre: string;
  titre: string;
  description?: ReactNode;
  photo: Photo;
  /* Ce qui presse aujourd'hui (distribution du jour), a droite sur ordinateur. */
  children?: ReactNode;
}

/* En-tete des accueils, aux couleurs de Linkee : le bonjour et ce qui se passe aujourd'hui. */
export function BandeauAccueil({ surtitre, titre, description, photo, children }: Props) {
  return (
    <section aria-labelledby="titre-accueil" className="relative overflow-hidden rounded-3xl bg-night text-on-night">
      <div className="absolute inset-0 lg:left-1/2">
        <Image src={photo.src} alt="" preload placeholder="blur" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover opacity-30 lg:opacity-50" />
      </div>
      <div className={cn("relative grid grid-cols-1 gap-5 p-5 sm:p-8", children && "lg:grid-cols-2 lg:items-center")}>
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-sm font-semibold tracking-wider text-accent uppercase">{surtitre}</p>
          <h1 id="titre-accueil" className="font-display text-3xl leading-tight font-extrabold sm:text-4xl">
            {titre}
          </h1>
          {description && <p className="text-lg text-on-night-muted">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
