import { redirect } from "next/navigation";

/**
 * Page racine : redirige vers le tableau de bord.
 * proxy.ts intercepte les routes protegees et renvoie vers /login si non authentifie.
 */
export default function Home() {
  redirect("/dashboard");
}
