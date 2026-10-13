import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import {
  CATEGORIES_NATIONALITE,
  NIVEAUX_ACADEMIQUES,
  SITUATIONS_LOGEMENT,
  STATUTS_BOURSIER,
  libelle,
} from "@/lib/profil-beneficiaire";
import type { MembreResponse } from "@/types/association";
import type { ProfilBeneficiaireResponse } from "@/types/profil";

export const metadata: Metadata = { title: "Dossier bénéficiaire" };

interface PageProps {
  params: Promise<{ compteId: string }>;
}

function Ligne({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{titre}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{valeur}</dd>
    </div>
  );
}

export default async function DossierBeneficiairePage({ params }: PageProps) {
  const { compteId } = await params;
  const me = await lireMoi();
  // RG5 : lecture reservee au responsable, tracee par le backend a chaque ouverture.
  if (!me?.roles.includes("responsable")) notFound();
  const [dossier, membres] = await Promise.all([
    lireServeur<ProfilBeneficiaireResponse>(`/api/association/membres/${compteId}/profil-beneficiaire`),
    lireServeur<MembreResponse[]>("/api/association/membres"),
  ]);
  if (!dossier) notFound();
  const membre = membres?.find((m) => m.compteId === compteId);
  const euros = (v: number | null) =>
    v == null ? "Non renseigné" : v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/association/membres"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Retour aux membres"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            {membre ? `${membre.prenom} ${membre.nom}` : "Dossier bénéficiaire"}
          </h1>
          <p className="text-sm text-muted-foreground">Dossier social, en lecture seule.</p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
        <ShieldCheck className="size-4 shrink-0 mt-0.5 text-primary" />
        <span>
          Données confidentielles : cette consultation est enregistrée dans le journal d&apos;audit. Ne les
          recopiez pas hors de Solivio.
        </span>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card shadow-sm px-5">
        {!dossier.complet && (
          <p className="border-b border-border/60 py-3 text-sm text-warning">
            Dossier incomplet : la personne n&apos;a pas renseigné toutes les informations.
          </p>
        )}
        <dl className="divide-y divide-border/60">
          <Ligne
            titre="Date de naissance"
            valeur={dossier.dateNaissance ? new Date(`${dossier.dateNaissance}T12:00:00`).toLocaleDateString("fr-FR") : "Non renseigné"}
          />
          <Ligne titre="Statut boursier" valeur={libelle(STATUTS_BOURSIER, dossier.statutBoursier)} />
          <Ligne titre="Échelon de bourse" valeur={dossier.echelonBourse != null ? String(dossier.echelonBourse) : "Non renseigné"} />
          <Ligne titre="Nationalité" valeur={libelle(CATEGORIES_NATIONALITE, dossier.categorieNationalite)} />
          <Ligne titre="Reste à vivre mensuel" valeur={euros(dossier.resteAVivreMensuel)} />
          <Ligne titre="Niveau d'études" valeur={libelle(NIVEAUX_ACADEMIQUES, dossier.niveauAcademique)} />
          <Ligne titre="Établissement" valeur={dossier.etablissement ?? "Non renseigné"} />
          <Ligne titre="Logement" valeur={libelle(SITUATIONS_LOGEMENT, dossier.situationLogement)} />
          <Ligne
            titre="Emploi étudiant"
            valeur={dossier.aEmploiEtudiant == null ? "Non renseigné" : dossier.aEmploiEtudiant ? "Oui" : "Non"}
          />
        </dl>
      </section>
    </div>
  );
}
