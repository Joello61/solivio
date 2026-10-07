"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NAV_SECTIONS, filterNavItems, isNavItemActive } from "./navigation";
import { logout } from "@/lib/auth";
import type { MeResponse } from "@/types/auth";
import { ROLE_LABELS } from "@/lib/roles";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
        "hidden lg:flex flex-col shrink-0",
        "bg-white dark:bg-neutral-900 border-r border-border/60",
        "shadow-sm",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[64px]" : "w-[256px]",
      )}
    >
      {/* En-tete : logo + bouton collapse */}
      <div
        className={cn(
          "flex items-center border-b border-border/60 shrink-0",
          collapsed ? "h-auto flex-col py-3 px-0 gap-2" : "h-14 px-4 gap-3",
        )}
      >
        <Link
          href="/dashboard"
          title={collapsed ? "Solivio - Tableau de bord" : undefined}
          className={cn(
            "flex items-center gap-2.5 min-w-0",
            collapsed ? "justify-center" : "flex-1",
          )}
        >
          <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-xl bg-primary shadow-primary">
            <Image
              src="/logo.svg"
              alt="Solivio"
              width={18}
              height={18}
              style={{ width: 18, height: 18 }}
            />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-foreground font-display truncate">
              Solivio
            </span>
          )}
        </Link>

        <button
          onClick={onCollapseToggle}
          className={cn(
            "shrink-0 flex h-7 w-7 items-center justify-center rounded-lg",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "transition-all duration-150",
          )}
          aria-label={collapsed ? "Agrandir la barre laterale" : "Reduire la barre laterale"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation principale */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {NAV_SECTIONS.map((section, sectionIndex) => {
          const visibleItems = filterNavItems(section.items, roles);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sectionIndex} className="space-y-0.5">
              {/* Libelle de section */}
              {!collapsed && section.title && (
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">
                  {section.title}
                </p>
              )}
              {/* Separateur en mode collapsed */}
              {collapsed && section.title && sectionIndex > 0 && (
                <div className="mb-2 mx-1 border-t border-border/60" />
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
                        "flex h-9 w-9 items-center justify-center rounded-xl mx-auto",
                        "transition-all duration-150",
                        active
                          ? "bg-primary text-primary-foreground shadow-primary"
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
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      "transition-all duration-150",
                      active
                        ? "bg-primary text-primary-foreground shadow-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
      <div className={cn("border-t border-border/60 py-3 space-y-1", collapsed ? "px-2" : "px-3")}>
        {/* Profil */}
        {collapsed ? (
          <Link
            href="/mon-compte"
            title="Mon compte"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl mx-auto",
              "transition-all duration-150",
              isNavItemActive("/mon-compte", pathname)
                ? "bg-primary text-primary-foreground shadow-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold overflow-hidden">
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
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150",
              isNavItemActive("/mon-compte", pathname)
                ? "bg-primary text-primary-foreground shadow-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold overflow-hidden ring-2 ring-primary/20">
              {avatarSrc ? (
                <Image src={avatarSrc} alt="" fill sizes="32px" className="object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {user.prenom} {user.nom}
              </p>
              {roleLabel && (
                <p className="truncate text-xs opacity-70">{roleLabel}</p>
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
            "flex w-full items-center rounded-xl text-sm font-medium",
            "text-muted-foreground hover:bg-destructive/8 hover:text-destructive",
            "transition-all duration-150",
            "disabled:opacity-45 disabled:pointer-events-none",
            collapsed ? "h-9 justify-center" : "gap-3 px-3 py-2.5",
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

        {/* Theme toggle */}
        <div className={cn("pt-1 border-t border-border/40", collapsed ? "flex justify-center" : "")}>
          <ThemeToggle variant={collapsed ? "compact" : "label"} />
        </div>
      </div>
    </aside>
  );
}
