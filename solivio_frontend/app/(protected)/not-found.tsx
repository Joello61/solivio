import { PageIntrouvable } from "@/components/layout/EtatPage";

// Rendue dans le cadre de l'application (barre laterale, barre basse).
export default function NotFound() {
  return <PageIntrouvable retour="/dashboard" libelleRetour="Retour à l'accueil" />;
}
