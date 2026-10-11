"use client";

import { useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
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
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Exporter les données</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Une archive ZIP au format JSON : association, membres, distributions, inscriptions,
          événements, collectes, reconditionnement, notifications et journal d&apos;audit.
        </p>
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-foreground">
        <ShieldAlert className="size-4 shrink-0 mt-0.5 text-warning" />
        <span>
          L&apos;archive contient les dossiers des bénéficiaires. Conservez-la en lieu sûr ;
          chaque export est tracé dans le journal d&apos;audit.
        </span>
      </div>
      {erreur && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
          {erreur}
        </p>
      )}
      <Button size="sm" variant="outline" onClick={exporter} disabled={enCours}>
        {enCours ? <Spinner size="sm" className="mr-2" /> : <Download className="mr-2 size-4" />}
        Exporter les données (ZIP)
      </Button>
    </section>
  );
}
