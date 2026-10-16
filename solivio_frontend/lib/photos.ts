import benevoleColis from "@/public/images/linkee/benevole-colis.jpg";
import benevoleGilet from "@/public/images/linkee/benevole-gilet.jpg";
import camionCollecte from "@/public/images/linkee/camion-collecte.jpg";
import colis from "@/public/images/linkee/colis.jpg";
import equipeBanderole from "@/public/images/linkee/equipe-banderole.jpg";
import equipeHalle from "@/public/images/linkee/equipe-halle.jpg";
import equipeSalle from "@/public/images/linkee/equipe-salle.jpg";
import equipeSoiree from "@/public/images/linkee/equipe-soiree.jpg";
import salleDistribution from "@/public/images/linkee/salle-distribution.jpg";
import type { StaticImageData } from "next/image";

export interface Photo {
  src: StaticImageData;
  alt: string;
}

/* Photos de Linkee Toulouse, publiees avec l'accord des personnes photographiees. */
export const PHOTOS = {
  equipeSoiree: { src: equipeSoiree, alt: "L'équipe de bénévoles de Linkee Toulouse en gilets turquoise et bleus, réunie en fin de journée" },
  equipeHalle: { src: equipeHalle, alt: "Les bénévoles de Linkee posent en groupe devant la Halle" },
  equipeSalle: { src: equipeSalle, alt: "L'équipe réunie dans la salle de distribution" },
  equipeBanderole: { src: equipeBanderole, alt: "Les bénévoles de Linkee posent avec leur banderole sur des marches" },
  benevoleGilet: { src: benevoleGilet, alt: "Un bénévole souriant en gilet turquoise Linkee" },
  benevoleColis: { src: benevoleColis, alt: "Un bénévole porte un colis de denrées" },
  colis: { src: colis, alt: "Un colis de denrées : conserves, pain, fruits et biscuits" },
  salleDistribution: { src: salleDistribution, alt: "Des bénévoles en gilet préparent la salle de distribution" },
  camionCollecte: { src: camionCollecte, alt: "Le camion de Linkee qui collecte les denrées" },
} satisfies Record<string, Photo>;
