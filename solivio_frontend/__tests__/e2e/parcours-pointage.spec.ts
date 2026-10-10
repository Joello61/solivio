import { expect, test } from "@playwright/test";
import { aujourdhuiAParis, exigerBackend, seConnecter, sessionApi } from "./backend";

// Parcours critique de bout en bout, sur le vrai backend et un telephone (projet
// "mobile") : distribution du jour, inscription d'un beneficiaire, demarrage,
// puis pointage par un benevole inscrit.
const COORDINATEUR = "coordo1@solivio.app";
const BENEFICIAIRE = "benef7@solivio.app";
const NOM_BENEFICIAIRE = "Benef7";
const BENEVOLE = "benevole3@solivio.app";

test.describe("Parcours pointage", () => {
  test.beforeEach(async () => {
    await exigerBackend(test);
  });

  test("un benevole inscrit pointe un beneficiaire depuis son telephone", async ({ browser }) => {
    const coordo = await sessionApi(COORDINATEUR);
    const creation = await coordo.post("/api/distributions", {
      data: {
        titre: `Distribution e2e ${Date.now()}`,
        date: aujourdhuiAParis(),
        capaciteBeneficiaires: 10,
        capaciteBenevoles: 5,
        modeCreneau: "CRENEAU_UNIQUE",
        creneaux: [{ heureDebut: "10:00", heureFin: "12:00", capacite: 10 }],
      },
    });
    expect(creation.ok(), await creation.text()).toBeTruthy();
    const { id } = (await creation.json()) as { id: string };
    expect((await coordo.post(`/api/distributions/${id}/publier`)).ok()).toBeTruthy();

    const benevole = await sessionApi(BENEVOLE);
    try {
      // Le beneficiaire s'inscrit depuis l'interface.
      const contexteBeneficiaire = await browser.newContext();
      const pageBeneficiaire = await contexteBeneficiaire.newPage();
      await seConnecter(pageBeneficiaire, BENEFICIAIRE);
      await pageBeneficiaire.goto(`/distributions/${id}`);
      await pageBeneficiaire.getByRole("button", { name: "S'inscrire" }).click();
      await expect(pageBeneficiaire.getByRole("button", { name: "Se désinscrire" })).toBeVisible();
      await contexteBeneficiaire.close();

      // Le benevole s'inscrit, puis le coordinateur demarre la distribution.
      const inscriptionBenevole = await benevole.post(`/api/distributions/${id}/inscriptions`, {
        data: { type: "BENEVOLE" },
      });
      expect(inscriptionBenevole.ok(), await inscriptionBenevole.text()).toBeTruthy();
      expect((await coordo.post(`/api/distributions/${id}/demarrer`)).ok()).toBeTruthy();

      // Le benevole pointe le beneficiaire depuis la page de la distribution.
      const contexteBenevole = await browser.newContext();
      const page = await contexteBenevole.newPage();
      await seConnecter(page, BENEVOLE);
      await page.goto(`/distributions/${id}`);
      await page.getByRole("link", { name: /Pointage/ }).click();
      await page.getByLabel("Rechercher un inscrit").fill(NOM_BENEFICIAIRE);
      await page.getByRole("button", { name: "Rechercher" }).click();
      await page.getByRole("button", { name: "Marquer present" }).click();
      await contexteBenevole.close();

      await expect
        .poll(async () => {
          const inscrits = (await (await coordo.get(`/api/distributions/${id}/inscriptions`)).json()) as {
            nom: string;
            presence: string;
          }[];
          return inscrits.find((i) => i.nom === NOM_BENEFICIAIRE)?.presence;
        })
        .toBe("PRESENT");
    } finally {
      // Annuler la distribution annule ses inscriptions, meme si le parcours a
      // echoue : il reste rejouable malgre la limite hebdomadaire (RG1).
      await coordo.post(`/api/distributions/${id}/annuler`, { data: { motif: "Fin du test e2e" } });
      await coordo.dispose();
      await benevole.dispose();
    }
  });
});
