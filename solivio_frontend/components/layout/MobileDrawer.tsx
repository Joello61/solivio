"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, filterNavItems, isNavItemActive } from "./navigation";
import type { MeResponse } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface MobileDrawerProps {
  user: MeResponse;
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ user, open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const roles = user.roles ?? [];
  const prevPathnameRef = useRef(pathname);
  const onCloseRef = useRef(onClose);
  const avatarSrc = user.photoUrl ? `${API_URL}${user.photoUrl}` : null;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  /* Fermer automatiquement lors d'un changement de page. */
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      onCloseRef.current();
    }
  }, [pathname]);

  /* Bloquer le scroll du body quand le drawer est ouvert. */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Fond semi-transparent */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
          "transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau du drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border",
          "flex flex-col lg:hidden",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        aria-hidden={!open}
      >
        {/* En-tete */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border shrink-0">
          <span className="text-lg font-bold text-primary">Solivio</span>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {NAV_SECTIONS.map((section, sectionIndex) => {
            const visibleItems = filterNavItems(section.items, roles);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sectionIndex} className="space-y-0.5">
                {section.title && (
                  <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const active = isNavItemActive(item.href, pathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        "transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Pied : acces compte */}
        <div className="border-t border-border p-3 shrink-0">
          <Link
            href="/mon-compte"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
              "transition-colors",
              isNavItemActive("/mon-compte", pathname)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="Avatar"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <CircleUser className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-muted-foreground">Mon compte</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
