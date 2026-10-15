import { ListRow } from "@/components/ui/list-row";
import { Jauge } from "@/components/ui/jauge";
import { Statut } from "@/components/ui/statut";
import { DateBloc } from "@/components/agenda/DateBloc";
import { dateLongue, libellePlaces, lieuCourt, placesPour, plageDistribution } from "@/lib/agenda";
import { STATUT_DISTRIBUTION, STATUT_INSCRIPTION } from "@/lib/libelles";
import type { DistributionResponse, StatutInscription, TypeInscription } from "@/types/distribution";

interface Props {
  distribution: DistributionResponse;
  /* Type d'inscription du membre : fixe les places affichees. */
  type: TypeInscription;
  /* Inscription active du membre sur cette distribution. */
  monStatut?: StatutInscription;
}

/*
 * Une distribution dans l'agenda : jour, heure, lieu, puis les places. Le titre
 * n'est pas repete, il ne fait que redire la date.
 */
export function LigneDistribution({ distribution: d, type, monStatut }: Props) {
  const places = placesPour(d, type);
  const ouverte = d.statut === "PUBLIEE" || d.statut === "EN_COURS";
  const plage = plageDistribution(d);
  const lieu = lieuCourt(d.lieu);

  let detail = null;
  if (monStatut) {
    detail = <Statut libelle={STATUT_INSCRIPTION[monStatut]} />;
  } else if (!ouverte) {
    detail = <Statut libelle={STATUT_DISTRIBUTION[d.statut]} />;
  }

  return (
    <ListRow
      href={`/distributions/${d.id}`}
      debut={<DateBloc date={d.date} />}
      titre={
        <span className="tabular-nums">
          <span className="sr-only">{dateLongue(d.date)}, </span>
          {plage ?? "Horaire à venir"}
        </span>
      }
      sousTitre={
        <span className="flex flex-col gap-1.5">
          {lieu && <span className="truncate">{lieu}</span>}
          {ouverte && !monStatut && places && (
            <span className="flex flex-col gap-1">
              <Jauge
                valeur={places.capacite - places.restantes}
                capacite={places.capacite}
                libelle={libellePlaces(places.restantes)}
                taille="sm"
                sansTexte
                className="max-w-56"
              />
              <span className={places.restantes <= 0 ? "text-warning" : undefined}>
                {libellePlaces(places.restantes)}
              </span>
            </span>
          )}
        </span>
      }
      fin={detail}
    />
  );
}
