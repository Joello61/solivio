import type { Metadata } from "next";
import { PageIntrouvable } from "@/components/layout/EtatPage";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-background">
      <PageIntrouvable retour="/" libelleRetour="Retour à l'accueil" />
    </main>
  );
}
