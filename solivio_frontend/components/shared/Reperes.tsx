import { CalendarX, Clock, IdCard, ShoppingBag, Tags } from "lucide-react";
import { EncartInfo, EncartPhoto, type PointInfo } from "@/components/shared/Encarts";
import { PHOTOS } from "@/lib/photos";

// Ce que l'email de confirmation rappelle aussi (rappel-veille, confirmation-inscription).
const BENEFICIAIRE: PointInfo[] = [
  { icone: ShoppingBag, texte: "Apportez un sac pour vos denrées." },
  { icone: IdCard, texte: "Votre carte étudiante vous est demandée à l'accueil." },
  { icone: Clock, texte: "Venez à l'heure de votre créneau : on vous accueille par votre nom." },
  { icone: CalendarX, texte: "Un empêchement ? Libérez votre place, elle revient à la liste d'attente." },
];

const BENEVOLE: PointInfo[] = [
  { icone: Clock, texte: "Arrivez 1h30 avant le début pour préparer la salle." },
  { icone: Tags, texte: "Le coordinateur vous confie un rôle : accueil, colis, réassort." },
  { icone: CalendarX, texte: "Un empêchement ? Désinscrivez-vous tôt, l'équipe s'organise." },
];

/* Colonne de droite des ecrans de distribution : le jour J, vu du membre. */
export function ReperesDistribution({ benevole }: { benevole: boolean }) {
  return (
    <>
      <EncartPhoto
        photo={benevole ? PHOTOS.benevoleColis : PHOTOS.colis}
        titre={benevole ? "Une distribution, côté équipe" : "Le jour de la distribution"}
      >
        {benevole
          ? "Chaque semaine, l'équipe accueille les étudiants et prépare les colis."
          : "Des denrées réparties équitablement entre les étudiants inscrits."}
      </EncartPhoto>
      <EncartInfo titre="À savoir" points={benevole ? BENEVOLE : BENEFICIAIRE} ton="marque" />
    </>
  );
}
