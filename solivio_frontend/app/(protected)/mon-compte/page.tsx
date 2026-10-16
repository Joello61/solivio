import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FolderLock } from "lucide-react";
import { List, ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { ChangementMotDePasse } from "@/components/account/ChangementMotDePasse";
import { EffacementDonnees } from "@/components/account/EffacementDonnees";
import { FormulaireMonCompte } from "@/components/account/FormulaireMonCompte";
import { MesRoles } from "@/components/account/MesRoles";
import { SectionCompte } from "@/components/account/SectionCompte";
import { lireMoi } from "@/lib/api/serveur";
import { libelleRoles } from "@/lib/roles";

export const metadata: Metadata = { title: "Mon compte" };

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function MonComptePage() {
  const user = await lireMoi();
  if (!user) redirect("/login");

  const estBeneficiaire = user.roles.includes("beneficiaire");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        titre="Mon compte"
        description={`${libelleRoles(user.roles)}. Membre depuis le ${DATE.format(new Date(user.dateCreation))}.`}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SectionCompte id="profil" titre="Profil" description="Votre nom tel que l'équipe le voit.">
            <FormulaireMonCompte user={user} />
          </SectionCompte>

          {user.roles.length > 0 && (
            <SectionCompte id="roles" titre="Mes rôles" description="Bénévole, bénéficiaire, ou les deux.">
              <MesRoles roles={user.roles} />
            </SectionCompte>
          )}

          {estBeneficiaire && (
            <List>
              <ListRow
                href="/mon-compte/profil-beneficiaire"
                debut={<FolderLock aria-hidden="true" className="size-6 text-primary" />}
                titre="Mon dossier"
                sousTitre="Votre situation, confidentielle. Seuls les responsables y ont accès."
              />
            </List>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <SectionCompte
            id="securite"
            titre="Sécurité"
            description={
              user.authMethod === "google"
                ? "Vous vous connectez avec Google : pas de mot de passe à gérer ici."
                : "Changer le mot de passe ferme la session sur tous vos appareils."
            }
          >
            {/* Un compte Google n'a pas de mot de passe local. */}
            {user.authMethod === "password" && <ChangementMotDePasse />}
          </SectionCompte>

          <SectionCompte id="donnees" titre="Mes données">
            <EffacementDonnees />
          </SectionCompte>
        </div>
      </div>
    </div>
  );
}
