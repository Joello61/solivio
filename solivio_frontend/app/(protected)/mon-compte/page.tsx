import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderOpen,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  Clock,
  Key,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MeResponse } from "@/types/auth";
import { FormulaireMonCompte } from "@/components/account/FormulaireMonCompte";

export const metadata: Metadata = { title: "Mon compte" };

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  responsable: "Responsable",
  coordinateur: "Coordinateur",
  benevole: "Benevole",
  beneficiaire: "Beneficiaire",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

async function fetchMe(cookieHeader: string): Promise<MeResponse | null> {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:8080"}/api/auth/me`,
    { headers: { Cookie: cookieHeader }, cache: "no-store" }
  );
  return res.ok ? (res.json() as Promise<MeResponse>) : null;
}

export default async function MonComptePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const user = await fetchMe(cookieHeader);
  if (!user) redirect("/login");

  const estBeneficiaire = user.roles.includes("beneficiaire");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Mon compte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerer vos informations personnelles et votre photo de profil.
        </p>
      </div>

      {estBeneficiaire && (
        <Link
          href="/mon-compte/profil-beneficiaire"
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-150"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-800/40 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/40 transition-colors duration-150">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
              Dossier beneficiaire
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completez votre dossier social pour beneficier des distributions.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Carte metadata */}
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-5 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-800/40">
              <BadgeCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Statut du compte</p>
          </div>

          <div className="space-y-4">
            {/* Roles */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role{user.roles.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                ))}
                {user.superAdmin && (
                  <Badge variant="destructive" className="text-xs">
                    Super admin
                  </Badge>
                )}
              </div>
            </div>

            {/* Separateur */}
            <div className="border-t border-border/60" />

            {/* Lignes metadata */}
            <div className="space-y-3">
              {/* Email verifie */}
              <div className="flex items-start gap-3">
                {user.emailVerifie ? (
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-teal-500" />
                ) : (
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p
                    className={[
                      "text-sm font-medium",
                      user.emailVerifie ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400",
                    ].join(" ")}
                  >
                    {user.emailVerifie ? "Verifie" : "Non verifie"}
                  </p>
                </div>
              </div>

              {/* Methode de connexion */}
              <div className="flex items-start gap-3">
                <Key className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Connexion</p>
                  <p className="text-sm font-medium text-foreground">
                    {user.authMethod === "google" ? "Google" : "Email + mot de passe"}
                  </p>
                </div>
              </div>


              {/* Membre depuis */}
              <div className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Membre depuis</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(user.dateCreation)}
                  </p>
                </div>
              </div>

              {/* Derniere mise a jour */}
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Mis a jour le</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(user.dateModification)}
                  </p>
                </div>
              </div>
            </div>

            {/* ID utilisateur */}
            <div className="pt-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground mb-1">Identifiant</p>
              <p className="text-[11px] font-mono text-muted-foreground/60 break-all leading-relaxed select-all">
                {user.id}
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6">
          <FormulaireMonCompte user={user} />
        </div>
      </div>
    </div>
  );
}
