"use client";

import { useState, type ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { libelleRoles } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import { AvatarMembre, useDeconnexion } from "./identite";
import { itemActif, libelleNav, sectionsPourRoles } from "./navigation";

const ligne = "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base";

/* Menu complet sur mobile : toutes les rubriques du role, puis le compte. */
export function MenuMobile({ user, declencheur }: { user: MeResponse; declencheur: ReactElement }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();
  const { deconnecter, enCours } = useDeconnexion();
  const sections = sectionsPourRoles(user.roles);
  const actif = itemActif(sections.flatMap((s) => s.items), pathname);
  const fermer = () => setOuvert(false);

  return (
    <Sheet open={ouvert} onOpenChange={setOuvert}>
      <SheetTrigger render={declencheur} />
      <SheetContent className="gap-4">
        <div className="flex items-center gap-3 pr-10">
          <AvatarMembre user={user} className="size-11" />
          <div className="flex min-w-0 flex-col">
            <SheetTitle className="truncate text-xl">
              {user.prenom} {user.nom}
            </SheetTitle>
            <span className="text-sm text-muted-foreground">
              {libelleRoles(user.roles)}
            </span>
          </div>
        </div>

        <nav aria-label="Toutes les rubriques" className="flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.title ?? "principal"} className="flex flex-col">
              {section.title && (
                <p className="px-3 pb-1 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icone = item.icon;
                const estActif = item === actif;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={fermer}
                    aria-current={estActif ? "page" : undefined}
                    className={cn(ligne, estActif ? "bg-secondary font-semibold text-secondary-foreground" : "hover:bg-muted")}
                  >
                    <Icone aria-hidden="true" className="size-5 shrink-0" />
                    {libelleNav(item, user.roles)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex flex-col border-t border-border pt-3">
          <Link href="/mon-compte" onClick={fermer} className={cn(ligne, "hover:bg-muted")}>
            <CircleUser aria-hidden="true" className="size-5 shrink-0" />
            Mon compte
          </Link>
          <ThemeToggle variant="label" className={cn(ligne, "text-foreground")} />
          <button
            type="button"
            onClick={deconnecter}
            disabled={enCours}
            className={cn(ligne, "text-destructive hover:bg-destructive/10")}
          >
            {enCours ? <Spinner size="sm" /> : <LogOut aria-hidden="true" className="size-5 shrink-0" />}
            Se déconnecter
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
