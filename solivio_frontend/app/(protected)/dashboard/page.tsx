import Link from "next/link";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { BarChart3, Users, Heart, Calendar, Settings, UserCog, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import type { StatistiquePeriodeResponse } from "@/types/association";

export const metadata: Metadata = { title: "Tableau de bord" };

async function fetchDashboardData(): Promise<{
  me: MeResponse | null;
  statsMois: StatistiquePeriodeResponse | null;
  statsErreur: boolean;
}> {
  const now = new Date();
  const debut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fin = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(dernierJour).padStart(2, "0")}`;

  const me = await lireMoi();
  if (!estGestionnaireDistribution(me?.roles ?? [])) {
    return { me, statsMois: null, statsErreur: false };
  }
  const statsMois = await lireServeur<StatistiquePeriodeResponse>(
    `/api/statistiques/periode?debut=${debut}&fin=${fin}`,
  ).catch(() => null);
  return { me, statsMois, statsErreur: statsMois === null };
}

interface CarteStatistiqueProps {
  titre: string;
  valeur: number | string;
  description: string;
  icon: React.ElementType;
  couleur: "blue" | "green" | "purple";
}

const COULEURS = {
  blue:   "bg-primary/10 text-primary border border-primary/20",
  green:  "bg-warning/10 text-warning border border-warning/20",
  purple: "bg-primary/12 text-primary border border-primary/25",
};

function CarteStatistique({ titre, valeur, description, icon: Icon, couleur }: CarteStatistiqueProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 p-6 flex flex-col gap-4">
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
        "group flex items-center gap-3 rounded-xl border border-border/60 bg-card",
        "px-4 py-3.5 shadow-sm",
        "hover:border-primary/40 hover:shadow-md transition-all duration-150",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors duration-150">
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
  const { me, statsMois, statsErreur } = await fetchDashboardData();

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
          Bienvenue sur votre espace Linkee Toulouse.
        </p>
      </div>

      {/* Statistiques du mois */}
      {estGestionnaire && (
        <section className="space-y-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground font-display">Statistiques</h2>
            <span className="text-sm text-muted-foreground capitalize">{moisCourant}</span>
            <Link
              href="/statistiques"
              className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Voir le détail
              <ChevronRight className="size-4" />
            </Link>
          </div>
          {statsErreur ? (
            <div className="rounded-xl border border-border/60 bg-muted px-5 py-4 text-sm text-muted-foreground">
              Statistiques indisponibles. Vérifiez que le service est accessible.
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
                titre="Bénéficiaires servis"
                valeur={statsMois.nbBeneficiairesDistinctsServis}
                description="bénéficiaires distincts"
                icon={Heart}
                couleur="green"
              />
              <CarteStatistique
                titre="Bénévoles mobilises"
                valeur={statsMois.nbBenevolesDistincts}
                description="bénévoles distincts"
                icon={Users}
                couleur="purple"
              />
            </div>
          ) : null}
        </section>
      )}

      {/* Acces rapide */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground font-display">Accès rapide</h2>
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
