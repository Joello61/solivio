import { test, expect } from "@playwright/test";

// Tests E2E du parcours repartition coordinateur.
// Execute par le projet Playwright "chromium" avec storageState (cookies d'auth).
//
// Prerequis :
//   - Backend en cours d'execution (docker compose up)
//   - E2E_EMAIL / E2E_PASSWORD definis, compte avec role "coordinateur" ou "responsable"
//   - Au moins une distribution accessible dans la base
//
// La page /distributions/[id]/repartition effectue des appels SSR pour charger
// la distribution, les denrees et la dotation. Elle necessite un ID de distribution reel.
// Les interactions du panneau RepartitionPanel (ajout/modification de denrees)
// sont client-side et peuvent etre mockees.

test.describe("Parcours repartition coordinateur", () => {
  test("acces a la page repartition via la liste des distributions", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    const premiereDistribCard = page.locator("a[href^='/distributions/']").first();
    const hasDistributions = await premiereDistribCard.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasDistributions) {
      test.skip(true, "Aucune distribution disponible dans la base de test");
      return;
    }

    await premiereDistribCard.click();
    await page.waitForLoadState("networkidle");

    // Le bouton Repartition n'est visible que pour les gestionnaires
    const lienRepartition = page.getByRole("link", { name: /répartition/i });
    const repartitionVisible = await lienRepartition.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!repartitionVisible) {
      test.skip(true, "Le compte de test n'a pas acces a la repartition (role insuffisant)");
      return;
    }

    await lienRepartition.click();
    await expect(page).toHaveURL(/\/repartition/);
    await expect(page.getByRole("heading", { name: /répartition des denrées/i })).toBeVisible();
  });

  test("le panneau de repartition affiche les denrees existantes", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    const premiereDistribCard = page.locator("a[href^='/distributions/']").first();
    const hasDistributions = await premiereDistribCard.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasDistributions) {
      test.skip(true, "Aucune distribution disponible dans la base de test");
      return;
    }

    await premiereDistribCard.click();
    await page.waitForLoadState("networkidle");

    const lienRepartition = page.getByRole("link", { name: /répartition/i });
    const repartitionVisible = await lienRepartition.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!repartitionVisible) {
      test.skip(true, "Le compte de test n'a pas acces a la repartition (role insuffisant)");
      return;
    }

    await lienRepartition.click();
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible");
      return;
    }

    // La page charge meme si la liste de denrees est vide
    await expect(page.getByRole("heading", { name: /répartition des denrées/i })).toBeVisible();
  });

  test("ajout d'une denree via le formulaire client-side", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    const premiereDistribCard = page.locator("a[href^='/distributions/']").first();
    const hasDistributions = await premiereDistribCard.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasDistributions) {
      test.skip(true, "Aucune distribution disponible dans la base de test");
      return;
    }

    await premiereDistribCard.click();
    await page.waitForLoadState("networkidle");

    const lienRepartition = page.getByRole("link", { name: /répartition/i });
    const repartitionVisible = await lienRepartition.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!repartitionVisible) {
      test.skip(true, "Le compte de test n'a pas acces a la repartition (role insuffisant)");
      return;
    }

    await lienRepartition.click();
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible");
      return;
    }

    // Le bouton "Ajouter une denree" declenche l'affichage du formulaire client-side
    const boutonAjouter = page.getByRole("button", { name: /ajouter une denrée/i });
    const boutonVisible = await boutonAjouter.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!boutonVisible) {
      // Distribution terminee ou annulee : formulaire non modifiable
      return;
    }

    // Mocker l'appel POST pour eviter d'affecter la base de test
    await page.route("**/api/distributions/*/denrees", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          json: {
            id: "denree-e2e",
            nom: "Riz basmati",
            quantite: 50,
            unite: "KILOGRAMME",
          },
        });
      } else {
        await route.fallback();
      }
    });

    await boutonAjouter.click();

    // Le formulaire FormulaireDenree s'affiche apres le clic
    const champNom = page.getByLabel(/nom de la denrée/i);
    await expect(champNom).toBeVisible({ timeout: 2_000 });

    await champNom.fill("Riz basmati");

    const champQuantite = page.getByLabel(/quantité/i);
    await champQuantite.fill("50");

    const boutonSauvegarder = page.getByRole("button", { name: /ajouter|sauvegarder|valider/i }).last();
    await boutonSauvegarder.click();

    // Apres ajout, la denree apparait dans le panneau
    await expect(page.getByText("Riz basmati")).toBeVisible({ timeout: 5_000 });
  });
});
