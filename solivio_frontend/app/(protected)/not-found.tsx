import { PageIntrouvable } from "@/components/layout/PageIntrouvable";

// Rendue dans le cadre de l'application (barre laterale, barre basse).
export default function NotFound() {
  return <PageIntrouvable retour="/dashboard" libelleRetour="Retour au tableau de bord" />;
}
