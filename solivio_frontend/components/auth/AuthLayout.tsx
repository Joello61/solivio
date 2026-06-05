import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

/**
 * Layout commun pour toutes les pages d'authentification.
 * Affiche le logo Solivio, le titre et le formulaire centre.
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <span className="text-2xl font-bold tracking-tight text-primary">Solivio</span>
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">
            Solidarite etudiante
          </p>
        </div>

        {/* Encart */}
        <div className="rounded-xl border bg-card px-6 py-8 shadow-sm space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-card-foreground">{title}</h1>
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
