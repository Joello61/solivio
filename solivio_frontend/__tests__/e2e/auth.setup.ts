import { test as setup } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_STATE_FILE = path.join(__dirname, "../../.playwright/auth/state.json");

// Etablit l'etat d'authentification (cookies JWT) reutilise par les tests proteges.
// Si E2E_EMAIL ou E2E_PASSWORD ne sont pas definis (pas de backend disponible),
// cree un fichier d'etat vide : les tests qui requierent l'auth sautent automatiquement
// car ils detectent la redirection vers /login.
setup("etablir l'etat d'authentification", async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_STATE_FILE });
});
