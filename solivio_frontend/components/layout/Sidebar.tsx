"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NAV_SECTIONS, filterNavItems, isNavItemActive } from "./navigation";
import { logout } from "@/lib/auth";
import type { MeResponse } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  responsable: "Responsable",
  coordinateur: "Coordinateur",
  benevole: "Benevole",
  beneficiaire: "Beneficiaire",
};

interface SidebarProps {
  user: MeResponse;
  collapsed: boolean;
  onCollapseToggle: () => void;
}

export function Sidebar({ user, collapsed, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingLogout, setPendingLogout] = useState(false);

  const roles = user.roles ?? [];
  const primaryRole = roles[0];
  const roleLabel = primaryRole ? (ROLE_LABELS[primaryRole] ?? primaryRole) : null;
  const avatarSrc = user.photoUrl ? `${API_URL}${user.photoUrl}` : null;
  const initials = `${user.prenom[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase();

  async function handleLogout() {
    setPendingLogout(true);
    try {
      await logout();
    } catch {}
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card shrink-0",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[64px]" : "w-[248px]",
      )}
    >
      {/* En-tete : logo + collapse quand expanded */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border shrink-0 gap-2",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <Link
          href="/dashboard"
          title={collapsed ? "Solivio - Tableau de bord" : undefined}
          className={cn(
            "flex items-center gap-2 min-w-0",
            collapsed ? "justify-center" : "flex-1",
          )}
        >
          <Image
            src="/logo.svg"
            alt="Solivio"
            width={28}
            height={28}
            className="shrink-0 rounded-md"
          />
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-foreground truncate">
              Solivio
            </span>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={onCollapseToggle}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Reduire la barre laterale"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation principale */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-5",
          collapsed ? "px-2" : "pr-2",
        )}
      >
        {NAV_SECTIONS.map((section, sectionIndex) => {
          const visibleItems = filterNavItems(section.items, roles);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sectionIndex} className="space-y-0.5">
              {/* Libelle de section (expanded uniquement) */}
              {!collapsed && section.title && (
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              {/* Separateur de section (collapsed) */}
              {collapsed && section.title && sectionIndex > 0 && (
                <div className="mb-2 border-t border-border/60" />
              )}

              {visibleItems.map((item) => {
                const active = isNavItemActive(item.href, pathname);
                const Icon = item.icon;

                if (collapsed) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-all",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 border-l-[3px] rounded-r-lg py-2 pr-3 text-sm font-medium transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary pl-[9px]"
                        : "border-transparent pl-3 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Section compte en bas */}
      <div className={cn("border-t border-border py-2 space-y-0.5", collapsed ? "px-2" : "px-2")}>
        {/* Profil / Mon compte */}
        {collapsed ? (
          <Link
            href="/mon-compte"
            title="Mon compte"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-all",
              isNavItemActive("/mon-compte", pathname)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold overflow-hidden">
              {avatarSrc ? (
                <Image src={avatarSrc} alt="" fill sizes="28px" className="object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </Link>
        ) : (
          <Link
            href="/mon-compte"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
              isNavItemActive("/mon-compte", pathname)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold overflow-hidden ring-2 ring-primary/15">
              {avatarSrc ? (
                <Image src={avatarSrc} alt="" fill sizes="32px" className="object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground leading-tight">
                {user.prenom} {user.nom}
              </p>
              {roleLabel && (
                <p className="truncate text-[11px] text-muted-foreground">{roleLabel}</p>
              )}
            </div>
          </Link>
        )}

        {/* Deconnexion */}
        <button
          onClick={handleLogout}
          disabled={pendingLogout}
          title={collapsed ? "Se deconnecter" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg text-sm font-medium transition-all",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            "disabled:opacity-50 disabled:pointer-events-none",
            collapsed ? "h-10 justify-center" : "gap-3 px-3 py-2.5",
          )}
        >
          {pendingLogout ? (
            <Spinner size="sm" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && (
            <span>{pendingLogout ? "Deconnexion..." : "Se deconnecter"}</span>
          )}
        </button>

        {/* Bas : theme toggle + collapse */}
        <div className="pt-1 border-t border-border/40 space-y-0.5">
          {/* Toggle dark/light */}
          {collapsed ? (
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          ) : (
            <ThemeToggle variant="label" />
          )}
        </div>
      </div>
    </aside>
  );
}
