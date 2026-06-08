"use client";

import { useState } from "react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  responsable: "Responsable",
  coordinateur: "Coordinateur",
  benevole: "Benevole",
  beneficiaire: "Beneficiaire",
};

interface HeaderProps {
  user: MeResponse;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);

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
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Logo cliquable (mobile uniquement, la sidebar s'en charge sur desktop) */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 lg:hidden shrink-0"
        >
          <Image src="/logo.svg" alt="Solivio" width={28} height={28} className="rounded-md" />
          <span className="font-bold text-foreground tracking-tight">Solivio</span>
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
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold overflow-hidden">
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
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
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
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Mon compte</span>
                  </Link>
                  {user.superAdmin && (
                    <Link
                      href="/admin/utilisateurs"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
