import type { ReactNode } from "react";
import Image from "next/image";
import { ClipboardCheck, MapPin, Package, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:flex">

      {/* Panneau gauche - branding desktop uniquement */}
      <div className="hidden lg:flex lg:w-[540px] xl:w-[600px] shrink-0 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-primary/90">
        <Image
          src="/images/auth-hero.png"
          alt=""
          fill
          sizes="600px"
          className="object-cover object-center pointer-events-none select-none"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: "color-mix(in oklch, color-mix(in oklch, var(--primary) 70%, var(--overlay)) 35%, transparent)" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/30 shrink-0">
            <Image src="/logo.svg" alt="Solivio" width={20} height={20} style={{ width: 20, height: 20 }} />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary-foreground font-display">Solivio</span>
        </div>

        <div className="relative z-10">
          <div className="rounded-2xl bg-overlay/25 backdrop-blur-md border border-primary-foreground/10 p-6 space-y-6">
            <div className="space-y-2.5">
              <p className="text-3xl xl:text-4xl font-bold text-primary-foreground leading-tight font-display">
                La solidarite,<br />organisee simplement.
              </p>
              <p className="text-primary-foreground/75 text-sm leading-relaxed">
                Tout ce qu&apos;il faut pour coordonner votre association,
                sans la complexite des outils generiques.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                { icon: ClipboardCheck, text: "Inscriptions en un clic, confirmation automatique" },
                { icon: MapPin, text: "Pointage sur le terrain, meme hors connexion" },
                { icon: Package, text: "Répartition des denrées calculée instantanement" },
                { icon: ShieldCheck, text: "Données bénéficiaires protegees par conception" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-primary-foreground/15 border border-primary-foreground/20">
                    <Icon className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-primary-foreground/85 leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10">
          <span className="inline-block rounded-lg bg-overlay/30 backdrop-blur-sm px-3 py-1.5 text-xs text-primary-foreground/70 border border-primary-foreground/10">
            Plateforme open source - Licence AGPL v3
          </span>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">

        {/* Hero mobile - meme pattern que l'app mobile native */}
        <div
          className="lg:hidden shrink-0 px-6 pt-10 pb-14 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 70%, var(--overlay)) 100%)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/25 shrink-0">
              <Image src="/logo.svg" alt="Solivio" width={18} height={18} style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-xl font-bold text-primary-foreground font-display">Solivio</span>
          </div>
          <p className="text-2xl font-extrabold text-primary-foreground leading-tight font-display mb-2">
            La solidarite,<br />organisee simplement.
          </p>
          <p className="text-sm leading-relaxed text-primary-foreground/65">
            Inscriptions, distributions, répartition des denrées.
          </p>
        </div>

        {/* Zone formulaire */}
        {/* Mobile : white card rounded-t-3xl qui remonte sur le hero */}
        {/* Desktop : fond neutral avec card centree */}
        <div className="flex-1 flex flex-col bg-card rounded-t-3xl -mt-5 relative z-10 lg:rounded-none lg:mt-0 lg:bg-muted">
          <div className="flex-1 overflow-y-auto lg:overflow-visible lg:flex lg:items-center lg:justify-center lg:py-12 lg:px-4">
            <div className="w-full lg:max-w-[420px]">

              {/* Sur desktop : la div devient une card avec shadow */}
              <div className="lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card lg:shadow-xl lg:p-8">
                <div className="px-6 pt-7 pb-0 lg:px-0 lg:pt-0 space-y-1.5">
                  <h1 className="text-2xl font-bold text-foreground font-display">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                <div className="px-6 pt-5 pb-10 lg:px-0 lg:pt-6 lg:pb-0 space-y-5">
                  {children}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
