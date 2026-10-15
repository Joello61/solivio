"use client";

import { useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { exporterDonnees } from "@/lib/api/association";

const NOM_FICHIER = "export-solivio.zip";

/** Export complet des donnees de l'association (portabilite), reserve aux responsables. */
export function ExportDonnees() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function exporter() {
    setEnCours(true);
    setErreur(null);
    try {
      const zip = await exporterDonnees();
      const url = URL.createObjectURL(zip);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = NOM_FICHIER;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'export n'a pas pu aboutir.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section aria-labelledby="titre-donnees" className="flex max-w-2xl flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 id="titre-donnees" className="font-display text-xl font-bold text-foreground">
        Données et confidentialité
      </h2>
      <p className="text-base text-muted-foreground">
        Une archive ZIP au format JSON : association, membres, distributions, inscriptions, événements, collectes,
        reconditionnement, notifications et journal d&apos;audit.
      </p>
      <Alert variant="warning" role="note">
        <ShieldAlert aria-hidden="true" />
        L&apos;archive contient les dossiers des bénéficiaires. Conservez-la en lieu sûr ; chaque export est tracé dans le
        journal d&apos;audit.
      </Alert>
      {erreur && <Alert variant="destructive">{erreur}</Alert>}
      <Button variant="outline" onClick={exporter} disabled={enCours} className="self-start">
        {enCours ? <Spinner size="sm" /> : <Download aria-hidden="true" />}
        Exporter les données
      </Button>
    </section>
  );
}
