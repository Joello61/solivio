import type { Metadata } from "next";
import { EmailLibreForm } from "@/components/shared/EmailLibreForm";
import { FormInfoPanel } from "@/components/layout/FormInfoPanel";

export const metadata: Metadata = { title: "Email aux membres" };

export default function EmailLibrePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">
          Email aux membres
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envoyez un message email à un groupe de membres.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Formulaire */}
        <div>
          <EmailLibreForm />
        </div>

        {/* Panneau info - masqué sur mobile */}
        <div className="hidden lg:block">
          <FormInfoPanel
            imageSrc="/images/forms/email-groupe.jpg"
            imageAlt="Envoi d'email groupé aux membres"
            titre="Envoi d'email groupé"
            description="Envoyez un message personnalisé à un groupe de membres de l'association. L'email sera transmis à tous les membres correspondant à la cible choisie."
            points={[
              "Choisissez soigneusement votre audience cible",
              "Le sujet doit être clair et incitatif",
              "Relisez votre message avant confirmation",
              "L'envoi est immédiat et irréversible",
              "Les réponses arrivent sur l'adresse de l'association",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
