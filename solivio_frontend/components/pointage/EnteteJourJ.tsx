import Link from "next/link";
import { X } from "lucide-react";

interface Props {
  quitter: string;
  pastille: string;
  intitule: string;
  presents: number;
  attendus: number;
  /* Compteur d'appoint a droite : l'equipe presente. */
  complement?: string;
}

/* Bandeau colle du pointage : combien sont arrives, d'un coup d'oeil. */
export function EnteteJourJ({ quitter, pastille, intitule, presents, attendus, complement }: Props) {
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 bg-foreground px-4 pt-2.5 pb-4 text-background sm:px-6 dark:border-b dark:border-border dark:bg-card dark:text-foreground">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
        <Link href={quitter} className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-base font-semibold hover:bg-current/10">
          <X aria-hidden="true" className="size-5" />
          Quitter
        </Link>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-accent px-3 text-sm font-bold text-accent-foreground">
          <span aria-hidden="true" className="size-2 rounded-full bg-accent-foreground" />
          {pastille}
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm opacity-75">{intitule}</p>
          <p aria-live="polite" className="flex items-baseline gap-2">
            <span className="font-display text-5xl leading-none font-extrabold tabular-nums">{presents}</span>
            <span className="text-lg opacity-80">
              présent{presents > 1 ? "s" : ""} sur {attendus}
            </span>
          </p>
        </div>
        {complement && <p className="shrink-0 font-mono text-sm opacity-80 tabular-nums">{complement}</p>}
      </div>
      <div aria-hidden="true" className="mx-auto h-2 w-full max-w-3xl overflow-hidden rounded-full bg-current/20">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${attendus ? (presents / attendus) * 100 : 0}%` }}
        />
      </div>
    </header>
  );
}
