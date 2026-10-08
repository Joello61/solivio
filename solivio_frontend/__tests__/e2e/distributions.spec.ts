import { test, expect } from "@playwright/test";

// Tests E2E des parcours distributions et pointage.
// Execute par le projet Playwright "chromium" avec storageState (cookies d'auth).
//
// Prerequis pour les tests authentifies :
//   - Backend en cours d'execution (docker compose up)
//   - E2E_EMAIL et E2E_PASSWORD definis pour generer les cookies via auth.setup.ts
//
// Si l'auth n'est pas disponible, les tests detectent la redirection vers /login
// et se sautent automatiquement.

// La page /distributions/[id]/pointage ne fait aucun appel backend SSR propre
// (uniquement le check d'auth du layout protege). Les interactions client-side
// de PointageListe sont interceptables via page.route().

const RECHERCHE_POINTAGE = (url: URL) => url.pathname.endsWith("/api/distributions/dist-e2e/pointage");

test.describe("Pointage - interactions client-side", () => {
  test("champ de recherche presente sur la page de pointage", async ({ page }) => {
    await page.goto("/distributions/dist-e2e/pointage");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    await expect(page.getByLabel("Rechercher un inscrit")).toBeVisible();
  });

  test("recherche affiche les resultats mockes", async ({ page }) => {
    // Recherche seule : la liste des visiteurs ponctuels partage le prefixe /pointage.
    await page.route(RECHERCHE_POINTAGE, (route) =>
      route.fulfill({
        json: [
          {
            inscriptionId: "insc-1",
            nom: "Dupont",
            prenom: "Marie",
            type: "BENEFICIAIRE",
            statut: "CONFIRMEE",
            presence: "NON_POINTE",
            heureCreneauDebut: null,
            heureCreneauFin: null,
          },
        ],
      }),
    );

    await page.goto("/distributions/dist-e2e/pointage");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    const input = page.getByLabel("Rechercher un inscrit");
    await input.fill("Du");
    await page.getByRole("button", { name: /rechercher/i }).click();

    await expect(page.getByText("Dupont Marie")).toBeVisible();
  });

  test("clic sur 'Marquer present' met a jour le statut", async ({ page }) => {
    await page.route(RECHERCHE_POINTAGE, (route) =>
      route.fulfill({
        json: [
          {
            inscriptionId: "insc-1",
            nom: "Martin",
            prenom: "Paul",
            type: "BENEVOLE",
            statut: "CONFIRMEE",
            presence: "NON_POINTE",
            heureCreneauDebut: null,
            heureCreneauFin: null,
          },
        ],
      }),
    );
    await page.route("**/api/distributions/dist-e2e/pointage/insc-1", (route) =>
      route.fulfill({ status: 200, json: {} }),
    );
    await page.goto("/distributions/dist-e2e/pointage");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    await page.getByLabel("Rechercher un inscrit").fill("Ma");
    await page.getByRole("button", { name: /rechercher/i }).click();
    await expect(page.getByText("Martin Paul")).toBeVisible();

    await page.getByRole("button", { name: "Marquer present" }).click();
    // Apres le pointage, la liste se met a jour localement (pas de rechargement SSR)
    await expect(page.getByText("Present", { exact: true })).toBeVisible();
  });
});

test.describe("Liste des distributions", () => {
  test("affiche la page distributions pour un utilisateur connecte", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      test.skip(true, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    await expect(page.getByRole("heading", { name: /distributions/i })).toBeVisible();
  });
});
