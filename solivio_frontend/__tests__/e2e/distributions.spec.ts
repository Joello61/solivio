import { test, expect } from "@playwright/test";
import { sauterHorsCi } from "./backend";

// Tests E2E de la liste des distributions.
// Execute par le projet Playwright "chromium" avec storageState (cookies d'auth).
//
// Prerequis pour les tests authentifies :
//   - Backend en cours d'execution (docker compose up)
//   - E2E_EMAIL et E2E_PASSWORD definis pour generer les cookies via auth.setup.ts
//
// Si l'auth n'est pas disponible, les tests detectent la redirection vers /login
// et se sautent automatiquement.

// Le pointage est couvert par parcours-pointage.spec.ts, sur le vrai backend : la
// page verifie l'acces aupres du backend, une distribution simulee n'y suffit plus.

test.describe("Liste des distributions", () => {
  test("affiche la page distributions pour un utilisateur connecte", async ({ page }) => {
    await page.goto("/distributions");

    if (page.url().includes("/login")) {
      sauterHorsCi(test, "Backend non disponible - lancer docker compose up et definir E2E_EMAIL/E2E_PASSWORD");
      return;
    }

    // Planning pour un gestionnaire, Agenda pour un membre.
    await expect(page.getByRole("heading", { level: 1, name: /planning|agenda/i })).toBeVisible();
  });
});
