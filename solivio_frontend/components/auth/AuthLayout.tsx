import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/identite";
import { NOM_ASSOCIATION } from "@/lib/marque";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

/* Ecrans d'acces : une seule colonne, le formulaire d'abord, sans decor. */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg font-display text-lg font-bold text-foreground">
          <Logo />
          {NOM_ASSOCIATION}
        </Link>
      </header>
      <main id="contenu" className="flex flex-1 justify-center px-4 pb-16 pt-6 sm:items-start sm:pt-12">
        <div className="w-full max-w-md sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
          <div className="mt-7 flex flex-col gap-5">{children}</div>
        </div>
      </main>
    </div>
  );
}
