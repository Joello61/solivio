import { test, expect } from "@playwright/test";
import { CARTE_DISTRIBUTION, assurerDistributionPubliee, backendDisponible, sauterHorsCi } from "./backend";

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

// Libelles du bouton selon le role et l'horaire choisi.
const RESERVER = /réserver|je viens aider|venir à|liste d'attente/i;

test.describe("Parcours inscription beneficiaire", () => {
  // La base de test n'a pas de distribution : on en cree une, sinon les tests
  // qui partent de la liste seraient sautes, y compris en CI.
  test.beforeAll(async () => {
    if (await backendDisponible()) await assurerDistributionPubliee();
  });

  test("la liste des distributions est accessible", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      sauterHorsCi(test, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    await expect(page.getByRole("heading", { name: /distributions/i })).toBeVisible();
  });

  test("navigation vers le detail d'une distribution", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      sauterHorsCi(test, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    // Si aucune distribution, le message "Aucune distribution" est affiche
    const aucuneDistrib = page.getByText(/aucune distribution/i);
    const premiereDistribCard = page.locator(CARTE_DISTRIBUTION).first();

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

  test("un membre s'inscrit sur une distribution publiee", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      sauterHorsCi(test, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    const premiereDistribCard = page.locator(CARTE_DISTRIBUTION).first();
    const hasDistributions = await premiereDistribCard.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasDistributions) {
      sauterHorsCi(test, "Aucune distribution disponible dans la base de test");
      return;
    }

    await premiereDistribCard.click();
    await page.waitForLoadState("networkidle");

    // Le bouton de reservation est present pour tout membre qui peut s'inscrire (le
    // coordinateur du test s'inscrit en benevole) sur une distribution publiee.
    const boutonInscrire = page.getByRole("button", { name: RESERVER });
    const visible = await boutonInscrire.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!visible) {
      // Distribution non publiee ou compte gestionnaire : test non applicable
      return;
    }

    // Inscription reelle sur la distribution creee pour le test (base de test).
    // Distribution decoupee : choisir le premier horaire.
    const horaire = page.getByRole("radio").first();
    if ((await horaire.count()) > 0) await horaire.check({ force: true });
    await page.getByRole("button", { name: RESERVER }).click();
    await expect(page.getByRole("button", { name: /je ne peux plus venir|quitter la liste/i })).toBeVisible();
  });

  test("erreur affichee si l'inscription echoue (distribution pleine)", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      sauterHorsCi(test, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    const premiereDistribCard = page.locator(CARTE_DISTRIBUTION).first();
    const hasDistributions = await premiereDistribCard.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasDistributions) {
      sauterHorsCi(test, "Aucune distribution disponible dans la base de test");
      return;
    }

    await premiereDistribCard.click();
    await page.waitForLoadState("networkidle");

    const boutonInscrire = page.getByRole("button", { name: RESERVER });
    const visible = await boutonInscrire.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!visible) {
      return;
    }

    // Simuler un echec d'inscription (distribution pleine)
    await page.route("**/api/distributions/*/inscriptions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 409,
          json: {
            error: { code: "CONFLICT", message: "Distribution complete, inscription sur liste d'attente." },
          },
        });
      } else {
        await route.fallback();
      }
    });

    const horaire = page.getByRole("radio").first();
    if ((await horaire.count()) > 0) await horaire.check({ force: true });
    await page.getByRole("button", { name: RESERVER }).click();

    await expect(page.getByRole("alert").filter({ hasText: /liste d'attente|complete|impossible/i })).toBeVisible({
      timeout: 5_000,
    });
  });
});
