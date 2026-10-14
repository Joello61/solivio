import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* Liste dense : une ligne par element, separateurs fins. Remplace les piles de cartes. */
export function List({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={cn("divide-y divide-border overflow-hidden rounded-xl border border-border bg-card", className)}
      {...props}
    />
  );
}

interface ListRowProps {
  /* Bloc de tete : date, avatar, icone. */
  debut?: ReactNode;
  titre: ReactNode;
  sousTitre?: ReactNode;
  /* Bloc de fin : statut, compteur, menu. */
  fin?: ReactNode;
  href?: string;
  className?: string;
}

export function ListRow({ debut, titre, sousTitre, fin, href, className }: ListRowProps) {
  const contenu = (
    <>
      {debut && <div className="shrink-0">{debut}</div>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate text-base font-semibold text-foreground">{titre}</div>
        {sousTitre && <div className="text-sm leading-snug text-muted-foreground">{sousTitre}</div>}
      </div>
      {fin && <div className="flex shrink-0 items-center gap-2">{fin}</div>}
      {href && <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />}
    </>
  );
  const classes = cn("flex min-h-16 items-center gap-3 px-4 py-3", className);

  return (
    <li>
      {href ? (
        <Link href={href} className={cn(classes, "hover:bg-muted focus-visible:-outline-offset-2")}>
          {contenu}
        </Link>
      ) : (
        <div className={classes}>{contenu}</div>
      )}
    </li>
  );
}
