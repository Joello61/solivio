import { test, expect } from "@playwright/test";

// Tests des routes publiques : pas d'authentification requise.
// Execute par le projet Playwright "public" (sans storageState).

test.describe("Redirections non authentifiees", () => {
  // Routes qui passent par le layout protege et redirigent vers /login sans cookie valide.
  const routesProtegees = [
    "/dashboard",
    "/distributions",
    "/distributions/some-id",
    "/distributions/some-id/pointage",
    "/distributions/nouvelle",
  ];

  for (const route of routesProtegees) {
    test(`${route} redirige vers /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Page login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("affiche le formulaire de connexion", async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  });

  test("affiche un lien vers la page d'inscription", async ({ page }) => {
    await expect(page.getByRole("link", { name: /inscription/i })).toBeVisible();
  });

  test("affiche un lien vers la reinitialisation du mot de passe", async ({ page }) => {
    await expect(page.getByRole("link", { name: /mot de passe oublie/i })).toBeVisible();
  });

  test("identifiants incorrects : affiche un message d'erreur", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({ status: 401, json: { error: { code: "INVALID_CREDENTIALS", message: "Identifiants invalides" } } }),
    );

    await page.getByLabel(/email/i).fill("inconnu@example.com");
    await page.getByLabel(/mot de passe/i).fill("mauvaismdp");
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page.getByText(/identifiants invalides/i)).toBeVisible();
  });
});

test.describe("Page inscription (register)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("affiche les champs du formulaire", async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /s'inscrire/i })).toBeVisible();
  });

  test("affiche un lien vers la connexion", async ({ page }) => {
    await expect(page.getByRole("link", { name: /connexion|se connecter/i })).toBeVisible();
  });
});
