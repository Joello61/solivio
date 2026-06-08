import type { ReactNode } from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:flex">
      {/* Panneau gauche - branding (desktop uniquement) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-foret-700">
        {/* Motif de fond */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Dégradé sombre en bas */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 inset-x-0 h-48"
          style={{
            background:
              "linear-gradient(to top, oklch(0.200 0.055 157 / 0.5), transparent)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Solivio"
            width={38}
            height={38}
            className="rounded-xl"
          />
          <span className="text-2xl font-bold tracking-tight text-white">
            Solivio
          </span>
        </div>

        {/* Message central */}
        <div className="relative z-10 space-y-5">
          <p className="text-3xl xl:text-4xl font-bold text-white leading-tight">
            La solidarite,<br />organisee simplement.
          </p>
          <p className="text-white/65 text-base leading-relaxed max-w-xs">
            Inscriptions, distributions, repartition des denrees - tout ce
            qu&apos;il faut pour coordonner votre association.
          </p>
        </div>

        {/* Pied */}
        <p className="relative z-10 text-white/30 text-xs">
          Plateforme open source - Licence AGPL v3
        </p>
      </div>

      {/* Panneau droit - formulaire */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-background">
        {/* Barre mobile avec branding */}
        <div className="lg:hidden bg-foret-700 px-5 py-5 flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Solivio"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="text-base font-bold text-white">Solivio</span>
        </div>

        {/* Zone du formulaire */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-5 py-10 lg:py-12">
          <div className="w-full max-w-[400px] space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
