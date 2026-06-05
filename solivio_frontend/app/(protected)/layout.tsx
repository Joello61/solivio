import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { MeResponse } from "@/types/auth";
import { Header } from "@/components/layout/Header";

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
  // Forwarder les cookies vers le backend (Next.js App Router).
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let user: MeResponse;
  try {
    const res = await fetch(
      `${process.env.API_URL ?? "http://localhost:8080"}/api/auth/me`,
      {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      },
    );
    if (!res.ok) redirect("/login");
    user = (await res.json()) as MeResponse;
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
