import { redirect } from "next/navigation";
import { lireMoi } from "@/lib/api/serveur";
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

  return (
    <RequeteProvider>
      <AppShell user={user}>{children}</AppShell>
    </RequeteProvider>
  );
}
