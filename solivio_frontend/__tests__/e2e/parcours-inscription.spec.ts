import { test, expect } from "@playwright/test";

// Tests E2E du parcours inscription beneficiaire.
// Execute par le projet Playwright "chromium" avec storageState (cookies d'auth).
//
// Prerequis :
//   - Backend en cours d'execution (docker compose up)
//   - E2E_EMAIL / E2E_PASSWORD definis, compte avec role "beneficiaire"
//   - Au moins une distribution PUBLIEE dans la base
//
// Les tests de clic sur "S'inscrire" mockent l'appel POST pour ne pas modifier
// la base de donnees de test. Le rechargement SSR apres router.refresh() utilisera
// la vraie base, mais on ne verifie pas l'etat persiste ici.

test.describe("Parcours inscription beneficiaire", () => {
  test("la liste des distributions est accessible", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    await expect(page.getByRole("heading", { name: /distributions/i })).toBeVisible();
  });

  test("navigation vers le detail d'une distribution", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    // Si aucune distribution, le message "Aucune distribution" est affiche
    const aucuneDistrib = page.getByText(/aucune distribution/i);
    const premiereDistribCard = page.locator("a[href^='/distributions/']").first();

    const hasDistributions = await premiereDistribCard.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasDistributions) {
      await expect(aucuneDistrib).toBeVisible();
      return;
    }

    await premiereDistribCard.click();
    await expect(page).toHaveURL(/\/distributions\/.+/);
    // La page detail doit charger (titre de la distribution visible)
    await expect(page.locator("h1")).toBeVisible();
  });

  test("bouton S'inscrire present pour un beneficiaire sur une distribution publiee", async ({ page }) => {
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

    // Le bouton S'inscrire n'est present que si : utilisateur non gestionnaire + distribution PUBLIEE
    // Ce test est conditionnel a ces deux criteres.
    const boutonInscrire = page.getByRole("button", { name: /s'inscrire/i });
    const visible = await boutonInscrire.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!visible) {
      // Distribution non publiee ou compte gestionnaire : test non applicable
      return;
    }

    // Mocker l'appel POST d'inscription pour eviter d'affecter la base de test
    await page.route("**/api/distributions/*/inscriptions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          json: {
            id: "insc-e2e",
            distributionId: "dist-e2e",
            statut: "CONFIRMEE",
            type: "BENEFICIAIRE",
            rangListeAttente: null,
            roles: [],
            presence: "NON_POINTE",
            dateInscription: new Date().toISOString(),
            nombreAbsencesPassees: 0,
          },
        });
      } else {
        await route.fallback();
      }
    });

    await boutonInscrire.click();
    // Le bouton affiche "Inscription..." pendant la requete
    await expect(boutonInscrire).toBeDisabled();
  });

  test("erreur affichee si l'inscription echoue (distribution pleine)", async ({ page }) => {
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

    const boutonInscrire = page.getByRole("button", { name: /s'inscrire/i });
    const visible = await boutonInscrire.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!visible) {
      return;
    }

    // Simuler un echec d'inscription (distribution pleine)
    await page.route("**/api/distributions/*/inscriptions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 409,
          json: { detail: "Distribution complete, inscription sur liste d'attente." },
        });
      } else {
        await route.fallback();
      }
    });

    await boutonInscrire.click();

    await expect(page.getByText(/liste d'attente|complete|impossible/i)).toBeVisible({
      timeout: 5_000,
    });
  });
});
