import Link from "next/link";
import { Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Jauge } from "@/components/ui/jauge";
import { List, ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { Rail } from "@/components/ui/rail";
import { Stat } from "@/components/ui/stat";
import { Statut } from "@/components/ui/statut";
import { ActionsCycle } from "@/components/distributions/ActionsCycle";
import { ReservationDistribution } from "@/components/distributions/ReservationDistribution";
import { BoutonDesinscription } from "@/components/inscriptions/BoutonDesinscription";
import { estDesistementTardif } from "@/lib/mes-inscriptions";
import { RoleBenevolePanel } from "@/components/distributions/RoleBenevolePanel";
import { TableInscrits } from "@/components/distributions/TableInscrits";
import { dateLongue, horaire, plageDistribution } from "@/lib/agenda";
import { ETAPES_CYCLE, etapeCycle } from "@/lib/cycle-distribution";
import { STATUT_INSCRIPTION } from "@/lib/libelles";
import type { RoleAttribuable } from "@/lib/roles-benevoles";
import { cn } from "@/lib/utils";
import type { StatistiqueDistributionResponse } from "@/types/association";
import type { DistributionResponse, InscriptionResponse, TypeInscription } from "@/types/distribution";

export type OngletFeuille = "vue" | "inscrits" | "equipe" | "denrees" | "bilan";

interface Props {
  distribution: DistributionResponse;
  inscrits: InscriptionResponse[];
  stats: StatistiqueDistributionResponse | null;
  roles: RoleAttribuable[];
  onglet: OngletFeuille;
  aujourdhui: string;
  /* Le gestionnaire peut aussi venir aider : son inscription et le type ouvert. */
  monInscription: InscriptionResponse | undefined;
  typeInscription: TypeInscription | null;
}

const DERNIERES = 5;

function capitale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/* Ou en est la distribution, et ce qui vient ensuite, en une phrase. */
function situation(d: DistributionResponse, aujourdhui: string): string | null {
  switch (d.statut) {
    case "BROUILLON":
      return "Brouillon : personne ne la voit encore. Publiez-la pour ouvrir les inscriptions.";
    case "PUBLIEE":
      if (d.date > aujourdhui) return `Inscriptions ouvertes. Le jour J s'ouvrira le ${dateLongue(d.date)}.`;
      if (d.date === aujourdhui) return "C'est aujourd'hui : ouvrez le jour J pour pointer les arrivées.";
      return "La date est passée sans que le jour J ait été ouvert.";
    case "EN_COURS":
      return d.date < aujourdhui
        ? "Le jour J est resté ouvert. Clôturez-le pour compter les absences et voir le bilan."
        : "Jour J en cours.";
    case "TERMINEE":
      return "Distribution close : le bilan est prêt.";
    default:
      return null;
  }
}

function Onglets({ id, actif, onglets }: { id: string; actif: OngletFeuille; onglets: { cle: OngletFeuille; libelle: string; nombre?: number }[] }) {
  return (
    <nav aria-label="Sections de la distribution" className="-mx-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1">
        {onglets.map((o) => (
          <li key={o.cle}>
            <Link
              href={o.cle === "vue" ? `/distributions/${id}` : `/distributions/${id}?onglet=${o.cle}`}
              scroll={false}
              aria-current={o.cle === actif ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-1.5 border-b-2 px-3 text-base whitespace-nowrap",
                o.cle === actif
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {o.libelle}
              {o.nombre !== undefined && <span className="tabular-nums text-muted-foreground">{o.nombre}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function VueEnsemble({ d, inscrits, id }: { d: DistributionResponse; inscrits: InscriptionResponse[]; id: string }) {
  const r = d.remplissage;
  const manquent = r.placesRestantesBenevoles ?? 0;
  const dernieres = [...inscrits]
    .sort((a, b) => b.dateInscription.localeCompare(a.dateInscription))
    .slice(0, DERNIERES);
  const horaires = Object.fromEntries(d.creneaux.map((c) => [c.id, horaire(c.heureDebut, c.heureFin) ?? ""]));

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="remplissage" className="flex flex-col gap-4">
        <h2 id="remplissage" className="font-display text-xl font-bold text-foreground">
          Remplissage
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Jauge
            valeur={r.beneficiairesConfirmes ?? 0}
            attente={r.beneficiairesEnAttente ?? 0}
            capacite={d.capaciteBeneficiaires}
            libelle={`${r.beneficiairesConfirmes ?? 0} bénéficiaires sur ${d.capaciteBeneficiaires}`}
            detail={r.beneficiairesEnAttente ? `${r.beneficiairesEnAttente} en attente` : `${r.placesRestantesBeneficiaires} places libres`}
            detailTon={r.beneficiairesEnAttente ? "attente" : "neutre"}
          />
          {d.capaciteBenevoles != null && (
            <Jauge
              ton="encre"
              valeur={r.benevolesConfirmes ?? 0}
              attente={r.benevolesEnAttente ?? 0}
              capacite={d.capaciteBenevoles}
              libelle={`${r.benevolesConfirmes ?? 0} bénévoles sur ${d.capaciteBenevoles}`}
              detail={manquent > 0 ? `${manquent} manque${manquent > 1 ? "nt" : ""}` : "Équipe complète"}
              detailTon={manquent > 0 ? "attente" : "neutre"}
            />
          )}
        </div>
      </section>

      {d.creneaux.length > 1 && (
        <section aria-labelledby="par-creneau" className="flex flex-col gap-4">
          <h2 id="par-creneau" className="font-display text-xl font-bold text-foreground">
            Par créneau
          </h2>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {d.creneaux.map((c) => (
              <Jauge
                key={c.id}
                taille="sm"
                valeur={c.confirmes ?? 0}
                attente={c.enAttente ?? 0}
                capacite={c.capacite}
                libelle={horaire(c.heureDebut, c.heureFin) ?? ""}
                detail={`${c.confirmes ?? 0}/${c.capacite}${c.enAttente ? `, ${c.enAttente} en attente` : ""}`}
                detailTon={c.enAttente ? "attente" : "neutre"}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="dernieres" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="dernieres" className="font-display text-xl font-bold text-foreground">
            Dernières inscriptions
          </h2>
          {inscrits.length > DERNIERES && (
            <Link href={`/distributions/${id}?onglet=inscrits`} scroll={false} className="font-semibold text-primary underline underline-offset-4">
              Voir les {inscrits.length}
            </Link>
          )}
        </div>
        {dernieres.length === 0 ? (
          <p className="text-base text-muted-foreground">Personne n&apos;est encore inscrit.</p>
        ) : (
          <List>
            {dernieres.map((i) => (
              <ListRow
                key={i.id}
                titre={`${i.nom} ${i.prenom}`}
                sousTitre={[
                  i.type === "BENEVOLE" ? "Bénévole" : null,
                  i.creneauId ? horaires[i.creneauId] : null,
                  i.type === "BENEFICIAIRE" && i.nombreAbsencesPassees > 0
                    ? `${i.nombreAbsencesPassees} absence${i.nombreAbsencesPassees > 1 ? "s" : ""} passée${i.nombreAbsencesPassees > 1 ? "s" : ""}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                fin={
                  <Statut
                    libelle={STATUT_INSCRIPTION[i.statut]}
                    detail={i.statut === "LISTE_ATTENTE" ? `rang ${i.rangListeAttente ?? "?"}` : undefined}
                  />
                }
              />
            ))}
          </List>
        )}
      </section>

      {d.description && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 font-display text-lg font-bold text-foreground">Description</h2>
          <p className="text-base leading-relaxed whitespace-pre-line text-foreground">{d.description}</p>
        </section>
      )}
    </div>
  );
}

function Participation({ d, mienne, type, aujourdhui }: { d: DistributionResponse; mienne: InscriptionResponse | undefined; type: TypeInscription; aujourdhui: string }) {
  return (
    <details open={mienne !== undefined} className="group rounded-xl border border-border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 font-display text-lg font-bold text-foreground [&::-webkit-details-marker]:hidden">
        {mienne ? "Votre participation" : "Venir aider sur cette distribution"}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">
      {mienne ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-base text-foreground">
            {mienne.statut === "LISTE_ATTENTE"
              ? `Vous êtes en liste d'attente, rang ${mienne.rangListeAttente ?? "?"}.`
              : "Vous faites partie de l'équipe."}
          </p>
          <BoutonDesinscription
            distributionId={d.id}
            inscriptionId={mienne.id}
            titre={`la distribution du ${dateLongue(d.date)}`}
            enAttente={mienne.statut === "LISTE_ATTENTE"}
            tardif={estDesistementTardif(mienne, d.date, aujourdhui)}
          />
        </div>
      ) : (
        <ReservationDistribution
          distributionId={d.id}
          creneaux={d.creneaux}
          modeCreneau={d.modeCreneau}
          type={type}
          placesRestantes={type === "BENEVOLE" ? d.remplissage.placesRestantesBenevoles : d.remplissage.placesRestantesBeneficiaires}
        />
      )}
      </div>
    </details>
  );
}

function Equipe({ d, benevoles, roles }: { d: DistributionResponse; benevoles: InscriptionResponse[]; roles: RoleAttribuable[] }) {
  if (benevoles.length === 0) {
    return <p className="text-base text-muted-foreground">Aucun bénévole inscrit pour l&apos;instant.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base text-muted-foreground">
        Attribuez un rôle à chacun : il apparaît sur son billet.
      </p>
      <List>
        {benevoles.map((b) => (
          <li key={b.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="min-w-48 text-base font-semibold text-foreground">
              {b.nom} {b.prenom}
            </span>
            <RoleBenevolePanel distributionId={d.id} inscriptionId={b.id} rolesInitiaux={b.roles} catalogue={roles} />
          </li>
        ))}
      </List>
    </div>
  );
}

function Bilan({ stats }: { stats: StatistiqueDistributionResponse | null }) {
  if (!stats) return <p className="text-base text-muted-foreground">Le bilan sera prêt quelques instants après la clôture.</p>;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat valeur={stats.nbInscritsBeneficiaires} libelle="inscrits" />
        <Stat valeur={stats.nbPresentsBeneficiaires} libelle="présents" />
        <Stat
          valeur={stats.nbAbsentsBeneficiaires}
          libelle="absents"
          detail={stats.nbNonPointes > 0 ? `et ${stats.nbNonPointes} non pointés` : undefined}
        />
        <Stat valeur={`${Math.round(Number(stats.tauxPresence))} %`} libelle="de présence" />
      </div>
      {stats.nbInscritsBenevoles > 0 && (
        <p className="text-base text-muted-foreground">{stats.nbInscritsBenevoles} bénévoles étaient inscrits dans l&apos;équipe.</p>
      )}
    </div>
  );
}

/*
 * La feuille d'une distribution pour les gestionnaires : une seule page qui suit
 * le cycle de vie, avec l'etape suivante toujours en tete.
 */
export function FeuilleDistribution({
  distribution: d,
  inscrits,
  stats,
  roles,
  onglet,
  aujourdhui,
  monInscription,
  typeInscription,
}: Props) {
  const actifs = inscrits.filter((i) => i.statut !== "ANNULEE");
  const benevoles = actifs.filter((i) => i.type === "BENEVOLE" && i.statut === "CONFIRMEE");
  const etape = etapeCycle(d.statut);
  const phrase = situation(d, aujourdhui);
  const plage = plageDistribution(d);
  const lieu = [d.lieu?.nom, d.lieu?.adresseFormatee].filter(Boolean).join(", ");
  const horaires = Object.fromEntries(d.creneaux.map((c) => [c.id, horaire(c.heureDebut, c.heureFin) ?? ""]));
  const onglets: { cle: OngletFeuille; libelle: string; nombre?: number }[] = [
    { cle: "vue", libelle: "Vue d'ensemble" },
    { cle: "inscrits", libelle: "Inscrits", nombre: actifs.length },
    { cle: "equipe", libelle: "Équipe", nombre: benevoles.length },
    { cle: "denrees", libelle: "Denrées" },
    ...(d.statut === "TERMINEE" ? [{ cle: "bilan" as const, libelle: "Bilan" }] : []),
  ];
  const courant = onglets.some((o) => o.cle === onglet) ? onglet : "vue";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        retour={{ href: "/distributions", libelle: "Planning" }}
        surtitre={d.statut === "BROUILLON" ? "Brouillon" : "Distribution"}
        titre={capitale(dateLongue(d.date))}
        description={[plage, d.creneaux.length > 1 ? `${d.creneaux.length} créneaux` : null, lieu].filter(Boolean).join(". ")}
        actions={
          <ActionsCycle
            distributionId={d.id}
            statut={d.statut}
            date={d.date}
            aujourdhui={aujourdhui}
            nbInscrits={actifs.length}
          />
        }
      />

      {d.statut === "ANNULEE" ? (
        <Alert variant="destructive">
          <AlertTitle>Distribution annulée</AlertTitle>
          {d.motifAnnulation && <AlertDescription>{d.motifAnnulation}</AlertDescription>}
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          {etape !== null && <Rail etapes={ETAPES_CYCLE} courante={etape} libelle="Cycle de la distribution" />}
          {phrase && <p className="text-base text-muted-foreground">{phrase}</p>}
        </div>
      )}

      <Onglets id={d.id} actif={courant} onglets={onglets} />

      {courant === "vue" && <VueEnsemble d={d} inscrits={actifs} id={d.id} />}
      {courant === "vue" && typeInscription && d.statut === "PUBLIEE" && (
        <Participation d={d} mienne={monInscription} type={typeInscription} aujourdhui={aujourdhui} />
      )}
      {courant === "inscrits" && (
        <TableInscrits inscrits={actifs} horaires={horaires} avecPresence={d.statut === "EN_COURS" || d.statut === "TERMINEE"} />
      )}
      {courant === "equipe" && <Equipe d={d} benevoles={benevoles} roles={roles} />}
      {courant === "denrees" && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-base text-muted-foreground">
            Saisissez ce qui a été reçu : Solivio calcule ce que chacun emporte.
          </p>
          <Link href={`/distributions/${d.id}/repartition`} className={buttonVariants({ variant: "outline" })}>
            <Package aria-hidden="true" />
            Répartition des denrées
          </Link>
        </div>
      )}
      {courant === "bilan" && <Bilan stats={stats} />}
    </div>
  );
}
