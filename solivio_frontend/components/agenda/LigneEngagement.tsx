import { ListRow } from "@/components/ui/list-row";
import { DateBloc } from "@/components/agenda/DateBloc";
import { dateLongue } from "@/lib/agenda";
import { LIBELLE_TYPE, type Engagement } from "@/lib/engagements";

/* Evenement, mission ou session dans une liste d'engagements. */
export function LigneEngagement({ engagement: e, avecMois = false }: { engagement: Engagement; avecMois?: boolean }) {
  return (
    <ListRow
      href={e.href}
      debut={<DateBloc date={e.date} avecMois={avecMois} />}
      titre={
        <>
          <span className="sr-only">{dateLongue(e.date)}, </span>
          {e.titre}
        </>
      }
      sousTitre={[LIBELLE_TYPE[e.type], e.heure, e.detail].filter(Boolean).join(", ")}
    />
  );
}
