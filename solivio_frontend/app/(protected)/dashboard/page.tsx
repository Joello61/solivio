import { cookies } from "next/headers";
import Link from "next/link";
import { BarChart3, Users, Heart, Calendar, Settings, UserCog, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import type { StatistiquePeriodeResponse } from "@/types/association";

export const metadata: Metadata = { title: "Tableau de bord" };

async function fetchDashboardData(cookieHeader: string): Promise<{
  me: MeResponse | null;
  statsMois: StatistiquePeriodeResponse | null;
  statsErreur: boolean;
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const now = new Date();
  const debut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fin = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(dernierJour).padStart(2, "0")}`;

  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;

  const estGestionnairePrecheck = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  let statsMois: StatistiquePeriodeResponse | null = null;
  let statsErreur = false;

  if (estGestionnairePrecheck) {
    try {
      const statsRes = await fetch(
        `${baseUrl}/api/statistiques/periode?debut=${debut}&fin=${fin}`,
        { headers, cache: "no-store" },
      );
      if (statsRes.ok) {
        statsMois = (await statsRes.json()) as StatistiquePeriodeResponse;
      } else {
        console.error("[dashboard] stats endpoint:", statsRes.status, statsRes.statusText);
        statsErreur = true;
      }
    } catch (err) {
      console.error("[dashboard] stats fetch failed:", err);
      statsErreur = true;
    }
  }

  return { me, statsMois, statsErreur };
}

interface CarteStatistiqueProps {
  titre: string;
  valeur: number | string;
  description: string;
  icon: React.ElementType;
  couleur: "blue" | "green" | "purple";
}

const COULEURS = {
  blue:   "bg-teal-50 text-primary border border-teal-100 dark:bg-teal-950/40 dark:border-teal-800/50",
  green:  "bg-orange-50 text-orange-500 border border-orange-100 dark:bg-orange-950/30 dark:text-orange-400",
  purple: "bg-teal-100/80 text-teal-700 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-300",
};

function CarteStatistique({ titre, valeur, description, icon: Icon, couleur }: CarteStatistiqueProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">{titre}</p>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", COULEURS[couleur])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <p className="text-4xl font-bold text-foreground tabular-nums font-display leading-none">{valeur}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface AccesRapideProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function AccesRapide({ href, icon: Icon, label }: AccesRapideProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border/60 bg-white dark:bg-neutral-900",
        "px-4 py-3.5 shadow-sm",
        "hover:border-primary/40 hover:shadow-md transition-all duration-150",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/40 transition-colors duration-150">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-150">
        {label}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
    </Link>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { me, statsMois, statsErreur } = await fetchDashboardData(cookieHeader);

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );
  const estResponsable = me?.roles.some((r) => ["responsable", "super_admin"].includes(r));

  const moisCourant = new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-10 max-w-5xl">

      {/* Salutation */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
          Bonjour, {me?.prenom ?? "utilisateur"}
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace{me?.tenantActif ? ` - ${me.tenantActif}` : ""}.
        </p>
      </div>

      {/* Statistiques du mois */}
      {estGestionnaire && (
        <section className="space-y-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground font-display">Statistiques</h2>
            <span className="text-sm text-muted-foreground capitalize">{moisCourant}</span>
          </div>
          {statsErreur ? (
            <div className="rounded-xl border border-border/60 bg-neutral-50 dark:bg-neutral-900 px-5 py-4 text-sm text-muted-foreground">
              Statistiques indisponibles. Verifiez que le service est accessible.
            </div>
          ) : statsMois ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <CarteStatistique
                titre="Distributions"
                valeur={statsMois.nbDistributions}
                description="ce mois-ci"
                icon={BarChart3}
                couleur="blue"
              />
              <CarteStatistique
                titre="Beneficiaires servis"
                valeur={statsMois.nbBeneficiairesDistinctsServis}
                description="beneficiaires distincts"
                icon={Heart}
                couleur="green"
              />
              <CarteStatistique
                titre="Benevoles mobilises"
                valeur={statsMois.nbBenevolesDistincts}
                description="benevoles distincts"
                icon={Users}
                couleur="purple"
              />
            </div>
          ) : null}
        </section>
      )}

      {/* Acces rapide */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground font-display">Acces rapide</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <AccesRapide href="/distributions" icon={Calendar} label="Distributions" />
          <AccesRapide href="/mes-inscriptions" icon={Users} label="Mes inscriptions" />
          {estResponsable && (
            <>
              <AccesRapide href="/association/configuration" icon={Settings} label="Configuration" />
              <AccesRapide href="/association/membres" icon={UserCog} label="Membres" />
            </>
          )}
        </div>
      </section>

    </div>
  );
}
