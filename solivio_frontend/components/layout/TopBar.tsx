"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { NOM_ASSOCIATION } from "@/lib/marque";
import type { MeResponse } from "@/types/auth";
import { AvatarMembre, Logo } from "./identite";
import { itemActif, libelleNav, sectionsPourRoles } from "./navigation";

/*
 * Barre du haut mobile : la rubrique courante, et un retour vers elle depuis une
 * page de detail. Sur l'accueil, l'identite de l'association.
 */
export function TopBar({ user }: { user: MeResponse }) {
  const pathname = usePathname();
  const items = sectionsPourRoles(user.roles).flatMap((s) => s.items);
  const rubrique = itemActif(items, pathname);
  const surRubrique = !rubrique || rubrique.href === pathname;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-2 backdrop-blur-md lg:hidden">
      {surRubrique ? (
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 px-2">
          <Logo />
          <span className="truncate font-display text-lg font-bold text-foreground">
            {!rubrique || rubrique.href === "/dashboard" ? NOM_ASSOCIATION : libelleNav(rubrique, user.roles)}
          </span>
        </Link>
      ) : (
        <Link
          href={rubrique.href}
          className="flex min-h-11 min-w-0 items-center gap-1 rounded-lg pr-3 pl-1 text-base font-semibold text-foreground hover:bg-muted"
        >
          <ChevronLeft aria-hidden="true" className="size-6 shrink-0" />
          <span className="truncate">{libelleNav(rubrique, user.roles)}</span>
        </Link>
      )}
      <Link href="/mon-compte" aria-label="Mon compte" className="ml-auto flex size-11 items-center justify-center rounded-full">
        <AvatarMembre user={user} />
      </Link>
    </header>
  );
}
