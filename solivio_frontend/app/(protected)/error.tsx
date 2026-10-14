"use client";

import { PageErreur } from "@/components/layout/PageErreur";

// Rendue dans le cadre de l'application : la navigation reste disponible.
export default function Erreur({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <PageErreur error={error} retry={retry} retour="/dashboard" libelleRetour="Retour à l'accueil" />;
}
