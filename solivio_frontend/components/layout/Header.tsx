"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">Solivio</span>
          {user.tenantActif && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">{user.tenantActif}</span>
            </>
          )}
        </div>

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            aria-expanded={menuOpen}
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="Avatar"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-medium leading-none text-card-foreground">
                {user.prenom} {user.nom}
              </p>
              {roleLabel && (
                <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-popover p-1 shadow-md">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-popover-foreground truncate">
                    {user.email}
                  </p>
                  {roleLabel && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {roleLabel}
                    </Badge>
                  )}
                </div>
                <Separator className="my-1" />
                <Link
                  href="/mon-compte"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors w-full"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Mon compte
                </Link>
                {user.superAdmin && (
                  <Link
                    href="/admin/utilisateurs"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors w-full"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Utilisateurs
                  </Link>
                )}
                <Separator className="my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                  disabled={pending}
                >
                  <LogOut className="h-4 w-4" />
                  {pending ? "Deconnexion..." : "Se deconnecter"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
