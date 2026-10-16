import { CalendarCheck, ClipboardCheck, Clock, PackageCheck, Truck, Users } from "lucide-react";
import { EncartInfo, EncartPhoto } from "@/components/shared/Encarts";
import { PHOTOS } from "@/lib/photos";

/* Colonnes de droite des listes d'activites : ce qu'est l'activite, comment elle se passe. */

export function ReperesEvenements() {
  return (
    <>
      <EncartPhoto photo={PHOTOS.equipeSoiree} titre="Les événements de Linkee">
        Stands, fêtes et ateliers : l&apos;association se retrouve aussi en dehors des distributions.
      </EncartPhoto>
      <EncartInfo
        titre="Comment ça marche"
        ton="marque"
        points={[
          { icone: Users, texte: "Certains cherchent une équipe de bénévoles, d'autres sont ouverts à tous." },
          { icone: CalendarCheck, texte: "La fiche dit si l'inscription est nécessaire, et combien de places restent." },
        ]}
      />
    </>
  );
}

export function ReperesReconditionnement() {
  return (
    <>
      <EncartPhoto photo={PHOTOS.salleDistribution} titre="Le reconditionnement">
        Répartir et réemballer les denrées en lots, avant une distribution.
      </EncartPhoto>
      <EncartInfo
        titre="Comment ça marche"
        ton="marque"
        points={[
          { icone: PackageCheck, texte: "Une séance de quelques heures, au local, en équipe." },
          { icone: Clock, texte: "Vous pouvez vous désinscrire tant que la séance n'a pas commencé." },
        ]}
      />
    </>
  );
}

export function ReperesMissions() {
  return (
    <>
      <EncartPhoto photo={PHOTOS.camionCollecte} titre="Les missions de collecte">
        Récupérer les dons d&apos;un partenaire et les déposer au local de l&apos;association.
      </EncartPhoto>
      <EncartInfo
        titre="Comment ça marche"
        ton="marque"
        points={[
          { icone: Truck, texte: "Un bénévole prend une mission et l'assure seul ; il peut la libérer s'il a un empêchement." },
          { icone: ClipboardCheck, texte: "Le responsable valide la collecte, puis le bénévole valide le dépôt." },
        ]}
      />
    </>
  );
}
