import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Billet, actionBillet } from "@/components/ui/billet";
import { BoutonDesinscription } from "@/components/inscriptions/BoutonDesinscription";
import { dateLongue, horaire } from "@/lib/agenda";
import { lienItineraire } from "@/lib/lieu";
import type { DonneesBillet } from "@/lib/mes-inscriptions";

interface Props {
  billet: DonneesBillet;
  /* Lien vers la fiche de la distribution, absent quand on y est deja. */
  lienFiche?: boolean;
  className?: string;
}

/* Rendez-vous d'un membre, presente comme un billet avec ses deux actions utiles. */
export function BilletInscription({ billet: b, lienFiche = false, className }: Props) {
  const enAttente = b.statut === "LISTE_ATTENTE";
  const itineraire = lienItineraire(b.position ?? { latitude: null, longitude: null, adresseFormatee: b.adresse });
  const lieu = (
    <>
      {b.lieuNom && <span className="block font-semibold text-on-brand">{b.lieuNom}</span>}
      {b.adresse && <span className="block">{b.adresse}</span>}
    </>
  );

  return (
    <Billet
      className={className}
      date={b.date}
      horaire={horaire(b.heureDebut, b.heureFin) ?? "Horaire à venir"}
      lieu={
        lienFiche ? (
          <Link href={`/distributions/${b.distributionId}`} className="hover:underline focus-visible:outline-on-brand">
            {lieu}
          </Link>
        ) : (
          lieu
        )
      }
      statut={
        <Badge variant="accent">
          {enAttente ? `Liste d'attente, rang ${b.rangListeAttente ?? "?"}` : "Confirmée"}
        </Badge>
      }
      note={b.benevole ? (b.roles?.length ? `Bénévole : ${b.roles.join(", ")}` : "Bénévole") : undefined}
      actions={
        (itineraire || b.desinscriptionPossible) && (
          <>
            {itineraire && (
              <a href={itineraire} target="_blank" rel="noopener noreferrer" className={actionBillet}>
                <MapPin aria-hidden="true" className="size-5" />
                Itinéraire
              </a>
            )}
            {b.desinscriptionPossible && (
              <BoutonDesinscription
                apparence="billet"
                distributionId={b.distributionId}
                inscriptionId={b.inscriptionId}
                titre={`la distribution du ${dateLongue(b.date)}`}
                enAttente={enAttente}
                tardif={b.desistementTardif}
              />
            )}
          </>
        )
      }
    />
  );
}
