import type { ReactNode } from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden bg-muted/30">
      {/* Fond decoratif subtil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(from var(--color-primary) l c h / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center">
            <Image src="/logo.svg" alt="Solivio" width={56} height={56} className="rounded-xl" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold tracking-tight text-foreground">Solivio</p>
            <p className="mt-0.5 text-xs text-muted-foreground uppercase tracking-widest">
              Solidarite etudiante
            </p>
          </div>
        </div>

        {/* Carte de contenu */}
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-8 shadow-md shadow-black/5 space-y-5">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-card-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
