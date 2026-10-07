"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Settings, ChevronDown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavBreadcrumb } from "./NavBreadcrumb";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import { ROLE_LABELS } from "@/lib/roles";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface HeaderProps {
  user: MeResponse;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const primaryRole = user.roles[0];
  const roleLabel = primaryRole ? (ROLE_LABELS[primaryRole] ?? primaryRole) : null;
  const avatarSrc = user.photoUrl ? `${API_URL}${user.photoUrl}` : null;
  const initials = `${user.prenom[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase();

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
    } catch {}
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/90 backdrop-blur-md shadow-xs dark:bg-neutral-950/90">
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Logo cliquable (mobile uniquement, la sidebar s'en charge sur desktop) */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 lg:hidden shrink-0"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary shadow-primary">
            <Image src="/logo.svg" alt="Solivio" width={18} height={18} style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-display font-bold text-foreground tracking-tight">Solivio</span>
        </Link>

        {/* Breadcrumb desktop uniquement */}
        <div className="hidden lg:flex flex-1 items-center min-w-0">
          <NavBreadcrumb />
        </div>

        {/* Separateur flexible sur mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Toggle theme */}
        <ThemeToggle className="hidden lg:flex" />

        {/* Menu utilisateur */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted transition-all duration-150"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold overflow-hidden ring-2 ring-primary/20">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={`${user.prenom} ${user.nom}`}
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="hidden sm:block text-left max-w-[140px]">
              <p className="text-sm font-medium leading-tight text-card-foreground truncate">
                {user.prenom} {user.nom}
              </p>
              {roleLabel && (
                <p className="text-xs text-muted-foreground leading-tight">{roleLabel}</p>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border/60 bg-white p-1.5 shadow-xl dark:bg-neutral-900">
                {/* Infos utilisateur */}
                <div className="px-3 py-2.5 space-y-1">
                  <p className="text-sm font-medium text-popover-foreground truncate">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {roleLabel && (
                    <Badge variant="secondary" className="mt-0.5 text-xs">
                      {roleLabel}
                    </Badge>
                  )}
                </div>

                <Separator className="my-1.5" />

                <div className="space-y-0.5">
                  <Link
                    href="/mon-compte"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-all duration-150"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Mon compte</span>
                  </Link>
                  {user.superAdmin && (
                    <Link
                      href="/admin/utilisateurs"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-all duration-150"
                    >
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Utilisateurs</span>
                    </Link>
                  )}
                </div>

                <Separator className="my-1.5" />

                <button
                  onClick={handleLogout}
                  disabled={pending}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                    "text-destructive hover:bg-destructive/10 transition-colors",
                    "disabled:opacity-50 disabled:pointer-events-none",
                  )}
                >
                  {pending ? (
                    <Spinner size="sm" className="text-destructive" />
                  ) : (
                    <LogOut className="h-4 w-4 shrink-0" />
                  )}
                  <span>{pending ? "Deconnexion..." : "Se deconnecter"}</span>
                </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
}
