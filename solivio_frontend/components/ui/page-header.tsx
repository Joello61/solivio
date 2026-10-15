import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  titre: ReactNode;
  /* Ligne de contexte sous le titre : ce que la page permet, ou ce qui se passe. */
  description?: ReactNode;
  /* Surtitre court en capitales (date, rubrique). */
  surtitre?: ReactNode;
  retour?: { href: string; libelle: string };
  /* Action principale, puis eventuellement un menu "Plus". */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ titre, description, surtitre, retour, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:mb-8", className)}>
      {/* Sur mobile, la barre du haut porte deja le retour. */}
      {retour && (
        <Link
          href={retour.href}
          className="-ml-1 hidden w-fit lg:inline-flex items-center gap-1 rounded-md text-base font-semibold text-primary hover:underline"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          {retour.libelle}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          {surtitre && (
            <p className="font-mono text-sm font-semibold uppercase tracking-wider text-primary">
              {surtitre}
            </p>
          )}
          <h1 className="font-display text-3xl leading-tight font-extrabold text-foreground sm:text-4xl">
            {titre}
          </h1>
          {description && (
            <div className="max-w-2xl text-base leading-snug text-muted-foreground sm:text-lg">
              {description}
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
