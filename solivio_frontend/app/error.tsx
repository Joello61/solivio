"use client";

import { PageErreur } from "@/components/layout/PageErreur";

export default function Erreur({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="min-h-dvh bg-background">
      <PageErreur error={error} retry={retry} retour="/" libelleRetour="Retour à l'accueil" />
    </main>
  );
}
