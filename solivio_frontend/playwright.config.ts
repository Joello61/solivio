import { defineConfig, devices } from "@playwright/test";

// Fichier d'etat d'authentification genere par auth.setup.ts avant les tests proteges.
export const AUTH_STATE_FILE = ".playwright/auth/state.json";

export default defineConfig({
  testDir: "./__tests__/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Genere les cookies d'authentification reutilises par le projet "chromium".
    // Necessite E2E_EMAIL, E2E_PASSWORD et un backend en cours d'execution.
    // Si les variables sont absentes, cree un etat vide : les tests proteges sautent.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Tests ne necessitant pas d'authentification (redirections, login, register).
    {
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /public\.spec\.ts/,
    },
    // Creation de compte de bout en bout : sans session, code lu dans Mailpit.
    {
      name: "creation-compte",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /creation-compte\.spec\.ts/,
    },
    // Parcours critiques sur telephone, contre le vrai backend : chaque test ouvre
    // ses propres sessions (Pixel 7 tourne sous Chromium, deja installe en CI).
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /parcours-pointage\.spec\.ts/,
    },
    // Audit axe des ecrans principaux : chaque test ouvre ses propres sessions.
    {
      name: "accessibilite",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /accessibilite\.spec\.ts/,
    },
    // Tests des parcours proteges. Depend du projet "setup" pour les cookies.
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE_FILE,
      },
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /public\.spec\.ts/, /creation-compte\.spec\.ts/, /parcours-pointage\.spec\.ts/, /accessibilite\.spec\.ts/],
    },
  ],
});
