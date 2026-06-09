import { cookies } from "next/headers";
import Link from "next/link";
import { BarChart3, Users, Heart, Calendar, Settings, UserCog } from "lucide-react";
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
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  purple: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function CarteStatistique({
  titre,
  valeur,
  description,
  icon: Icon,
  couleur,
}: CarteStatistiqueProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {titre}
        </p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", COULEURS[couleur])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tabular-nums">{valeur}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
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
        "flex items-center gap-3 rounded-xl border border-border bg-background",
        "px-4 py-3 text-sm font-medium text-foreground",
        "hover:bg-muted hover:border-primary/20 transition-all duration-150",
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      {label}
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
    <div className="space-y-8 max-w-5xl">
      {/* Salutation */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bonjour, {me?.prenom ?? "utilisateur"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenue sur votre espace{me?.tenantActif ? ` - ${me.tenantActif}` : ""}.
        </p>
      </div>

      {/* Statistiques du mois (gestionnaires uniquement) */}
      {estGestionnaire && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Statistiques -{" "}
            <span className="text-muted-foreground font-normal capitalize">{moisCourant}</span>
          </h2>
          {statsErreur ? (
            <p className="text-sm text-muted-foreground">
              Statistiques indisponibles. Verifiez que le service est accessible.
            </p>
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
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Acces rapide</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
