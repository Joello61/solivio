import { redirect } from "next/navigation";
import { lireDistributionsDuJour, lireMoi } from "@/lib/api/serveur";
import { AppShell } from "@/components/layout/AppShell";
import { RequeteProvider } from "@/components/providers/RequeteProvider";

/**
 * Layout des pages protegees.
 * Verifie l'authentification cote serveur en appelant /api/auth/me.
 * Si le backend retourne 401, redirige vers /login.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Une panne reseau renvoie aussi a la connexion.
  const user = await lireMoi().catch(() => null);

  if (!user) redirect("/login");

  // Le jour d'une distribution, la navigation mene droit au pointage (ou a la
  // fiche tant qu'elle n'a pas demarre).
  const [duJour] = await lireDistributionsDuJour(user.roles).catch(() => []);
  const jourJ = duJour
    ? duJour.statut === "EN_COURS" ? `/distributions/${duJour.id}/pointage` : `/distributions/${duJour.id}`
    : undefined;

  return (
    <RequeteProvider>
      <AppShell user={user} jourJ={jourJ}>{children}</AppShell>
    </RequeteProvider>
  );
}
