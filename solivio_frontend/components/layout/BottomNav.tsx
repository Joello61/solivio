"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import { MenuMobile } from "./MenuMobile";
import { bottomNavItems, isNavItemActive, libelleNav } from "./navigation";

const caseNav = "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 text-sm";

function Pastille({ actif, children }: { actif: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex h-8 w-14 items-center justify-center rounded-full",
        actif ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function BottomNav({ user, jourJ }: { user: MeResponse; jourJ?: string }) {
  const pathname = usePathname();
  const items = bottomNavItems(user.roles, jourJ);

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex items-stretch">
        {items.map((item) => {
          const actif = isNavItemActive(item.href, pathname);
          const Icone = item.icon;
          const jour = item.href === jourJ;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={actif ? "page" : undefined}
              className={cn(caseNav, actif ? "font-bold text-foreground" : "text-muted-foreground")}
            >
              {jour ? (
                <span className="flex h-8 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icone aria-hidden="true" className="size-5" />
                </span>
              ) : (
                <Pastille actif={actif}>
                  <Icone aria-hidden="true" className="size-5" />
                </Pastille>
              )}
              {libelleNav(item, user.roles)}
            </Link>
          );
        })}
        <MenuMobile
          user={user}
          declencheur={
            <button type="button" className={cn(caseNav, "text-muted-foreground")}>
              <Pastille actif={false}>
                <Menu aria-hidden="true" className="size-5" />
              </Pastille>
              Menu
            </button>
          }
        />
      </div>
    </nav>
  );
}
