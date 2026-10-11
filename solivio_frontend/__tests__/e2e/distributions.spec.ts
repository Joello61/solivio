import { test, expect } from "@playwright/test";

// Tests E2E de la liste des distributions.
// Execute par le projet Playwright "chromium" avec storageState (cookies d'auth).
//
// Prerequis pour les tests authentifies :
//   - Backend en cours d'execution (docker compose up)
//   - E2E_EMAIL et E2E_PASSWORD definis pour generer les cookies via auth.setup.ts
//
// Si l'auth n'est pas disponible, les tests detectent la redirection vers /login
// et se sautent automatiquement.

// Le pointage simule n'est plus possible : la page verifie l'acces aupres du
// backend, qui ne connait pas de distribution fictive. Le parcours reel est
// couvert par parcours-pointage.spec.ts.

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
