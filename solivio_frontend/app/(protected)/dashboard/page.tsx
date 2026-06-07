import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
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

  // Fetch stats uniquement si l'utilisateur est gestionnaire, pour eviter un 403 inutile.
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

function CarteStatistique({
  titre,
  valeur,
  description,
}: {
  titre: string;
  valeur: number | string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{titre}</p>
      <p className="text-3xl font-bold text-foreground">{valeur}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Bonjour, {me?.prenom ?? "utilisateur"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue sur votre espace{me?.tenantActif ? ` - ${me.tenantActif}` : ""}.
        </p>
      </div>

      {estGestionnaire && (
        <section>
          <h2 className="text-base font-medium text-foreground mb-3">
            Statistiques - {moisCourant}
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
                description="ce mois"
              />
              <CarteStatistique
                titre="Beneficiaires servis"
                valeur={statsMois.nbBeneficiairesDistinctsServis}
                description="beneficiaires distincts"
              />
              <CarteStatistique
                titre="Benevoles mobilises"
                valeur={statsMois.nbBenevolesDistincts}
                description="benevoles distincts"
              />
            </div>
          ) : null}
        </section>
      )}

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-medium text-base">Acces rapide</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/distributions"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
          >
            Distributions
          </Link>
          <Link
            href="/mes-inscriptions"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
          >
            Mes inscriptions
          </Link>
          {estResponsable && (
            <>
              <Link
                href="/association/configuration"
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
              >
                Configuration
              </Link>
              <Link
                href="/association/membres"
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
              >
                Membres
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
