"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import logoLinkee from "@/public/images/linkee/logo-linkee.png";
import type { MeResponse } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/*
 * Logo de Linkee, a la hauteur donnee par className (h-9 par defaut). Le bleu
 * du logo se perd sur fond sombre : une plaque blanche le porte alors
 * (automatique en mode sombre, `plaque` sur les sections bleu nuit).
 */
export function Logo({ className, plaque = false }: { className?: string; plaque?: boolean }) {
  return (
    <span className={cn("inline-flex h-9 shrink-0 rounded-lg px-1.5 py-1", plaque ? "bg-on-night" : "bg-logo-plate", className)}>
      <Image src={logoLinkee} alt="Linkee" className="h-full w-auto" />
    </span>
  );
}

export function AvatarMembre({ user, className }: { user: MeResponse; className?: string }) {
  const initiales = `${user.prenom[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase();
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-bold text-secondary-foreground",
        className,
      )}
    >
      {user.photoUrl ? (
        <Image unoptimized src={`${API_URL}${user.photoUrl}`} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        <span aria-hidden="true">{initiales}</span>
      )}
    </span>
  );
}

/* Deconnexion : le backend efface les cookies, puis retour a la connexion. */
export function useDeconnexion() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  async function deconnecter() {
    setEnCours(true);
    try {
      await logout();
    } catch {
      // Session deja expiree : la redirection suffit.
    }
    router.push("/login");
    router.refresh();
  }
  return { deconnecter, enCours };
}
