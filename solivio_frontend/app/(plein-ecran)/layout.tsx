import { redirect } from "next/navigation";
import { lireMoi } from "@/lib/api/serveur";
import { RequeteProvider } from "@/components/providers/RequeteProvider";

/*
 * Ecrans de pointage en plein ecran, hors du cadre de l'application : aucune
 * navigation cachee dessous ne prend le focus clavier. Meme garde que (protected).
 */
export default async function PleinEcranLayout({ children }: { children: React.ReactNode }) {
  const user = await lireMoi().catch(() => null);
  if (!user) redirect("/login");
  return <RequeteProvider>{children}</RequeteProvider>;
}
