"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { VILLE_ASSOCIATION } from "@/lib/marque";
import { libelleRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import { AvatarMembre, Logo, useDeconnexion } from "./identite";
import { itemActif, libelleNav, sectionsPourRoles } from "./navigation";

interface SidebarProps {
  user: MeResponse;
  /* Lien vers la distribution du jour, quand le membre y participe. */
  jourJ?: string;
}

/* Navigation ordinateur : groupee par intention, le compte en pied, une seule fois. */
export function Sidebar({ user, jourJ }: SidebarProps) {
  const pathname = usePathname();
  const { deconnecter, enCours } = useDeconnexion();
  const sections = sectionsPourRoles(user.roles);
  const actif = itemActif(sections.flatMap((s) => s.items), pathname);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex print:hidden">
      <Link href="/dashboard" className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Logo className="h-10" />
        <span className="truncate font-display text-lg font-bold text-foreground">{VILLE_ASSOCIATION}</span>
      </Link>

      <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pt-2 pb-4">
        {jourJ && (
          <Link href={jourJ} className={cn(buttonVariants({ variant: "accent" }), "w-full justify-start")}>
            <ClipboardCheck aria-hidden="true" />
            Jour J
          </Link>
        )}
        {sections.map((section) => (
          <div key={section.title ?? "principal"} className="flex flex-col gap-0.5">
            {section.title && (
              <p className="px-3 pb-1 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const estActif = item === actif;
              const Icone = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={estActif ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 text-base",
                    estActif
                      ? "bg-secondary font-semibold text-secondary-foreground"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icone aria-hidden="true" className="size-[1.125rem] shrink-0" />
                  {libelleNav(item, user.roles)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-1 border-t border-border p-3">
        <Link
          href="/mon-compte"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted"
        >
          <AvatarMembre user={user} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {user.prenom} {user.nom}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user.roles[0] ? libelleRole(user.roles[0]) : "Mon compte"}
            </span>
          </span>
        </Link>
        <ThemeToggle />
        <button
          type="button"
          onClick={deconnecter}
          disabled={enCours}
          aria-label="Se déconnecter"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
        >
          {enCours ? <Spinner size="sm" /> : <LogOut aria-hidden="true" />}
        </button>
      </div>
    </aside>
  );
}
