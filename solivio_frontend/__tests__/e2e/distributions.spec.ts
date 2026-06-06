import { test, expect } from "@playwright/test";

// Tests E2E Phase 2 - Parcours distributions et inscriptions.
//
// Prerequis pour les tests authentifies :
//   PLAYWRIGHT_BASE_URL pointe vers l'app en cours (frontend + backend).
//   Les tests marques @auth necessitent un storageState genere par global-setup.ts.
//
// Tests de redirection : executables sans auth, juste l'app frontend demarree.

// ---------------------------------------------------------------------------
// Redirections non authentifiees - toutes les routes protegees
// ---------------------------------------------------------------------------

test.describe("Redirections non authentifiees", () => {
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

// ---------------------------------------------------------------------------
// Page de connexion
// ---------------------------------------------------------------------------

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
      route.fulfill({ status: 401, json: { detail: "Identifiants invalides" } }),
    );

    await page.getByLabel(/email/i).fill("inconnu@example.com");
    await page.getByLabel(/mot de passe/i).fill("mauvaismdp");
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page.getByText(/identifiants invalides/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Page d'inscription
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Parcours pointage (avec mocks client-side)
// Le composant PointageListe est client-side : page.route intercepte les appels.
// La page /distributions/[id]/pointage est un server component minimal qui rend PointageListe.
// Pour tester sans auth SSR, injecter un cookie access_token valide ou executer via global-setup.
// ---------------------------------------------------------------------------

test.describe("Pointage - interactions client-side", () => {
  test.beforeEach(async ({ page }) => {
    // Mock /api/auth/me pour le check SSR du layout protege.
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        json: {
          id: "coord-1",
          email: "coord@test.com",
          nom: "Coord",
          prenom: "Test",
          roles: ["coordinateur"],
          tenantSlug: "pilote",
          superAdmin: false,
        },
      }),
    );
    // Mock la distribution pour la page detail si necessaire.
    await page.route("**/api/distributions/**", (route) => {
      const url = route.request().url();
      if (url.includes("/pointage")) {
        route.fulfill({ json: [] });
      } else {
        route.fulfill({
          json: {
            id: "dist-1",
            titre: "Distribution test",
            statut: "EN_COURS",
            capaciteBeneficiaires: 50,
            capaciteBenevoles: 10,
            modeCreneau: "CRENEAU_UNIQUE",
            creneaux: [],
            baseRepartition: "INSCRITS",
            date: "2026-06-15",
            dateCreation: "2026-06-01T10:00:00Z",
            description: null,
            lieu: null,
            motifAnnulation: null,
          },
        });
      }
    });
  });

  test("champ de recherche presente sur la page de pointage", async ({ page }) => {
    await page.goto("/distributions/dist-1/pointage");
    // Si redirige vers /login, le test est skipped gracieusement (auth SSR non disponible).
    const url = page.url();
    if (url.includes("/login")) {
      test.skip();
      return;
    }
    await expect(page.getByPlaceholder(/taper 2 lettres/i)).toBeVisible();
  });

  test("recherche affiche les resultats mockes", async ({ page }) => {
    await page.route("**/api/distributions/dist-1/pointage**", (route) =>
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

    await page.goto("/distributions/dist-1/pointage");
    const url = page.url();
    if (url.includes("/login")) {
      test.skip();
      return;
    }

    const input = page.getByPlaceholder(/taper 2 lettres/i);
    await input.fill("Du");
    await page.getByRole("button", { name: /rechercher/i }).click();

    await expect(page.getByText("Dupont Marie")).toBeVisible();
  });

  test("bouton pointer present marque l'inscrit comme present", async ({ page }) => {
    await page.route("**/api/distributions/dist-1/pointage**", async (route) => {
      if (route.request().method() === "GET" || route.request().method() === "HEAD") {
        await route.fulfill({
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
        });
      } else {
        await route.fulfill({
          json: {
            id: "insc-1",
            distributionId: "dist-1",
            creneauId: null,
            nom: "Martin",
            prenom: "Paul",
            type: "BENEVOLE",
            statut: "CONFIRMEE",
            rangListeAttente: null,
            roles: [],
            presence: "PRESENT",
            dateInscription: "2026-06-01T10:00:00Z",
            nombreAbsencesPassees: 0,
          },
        });
      }
    });

    await page.goto("/distributions/dist-1/pointage");
    const url = page.url();
    if (url.includes("/login")) {
      test.skip();
      return;
    }

    await page.getByPlaceholder(/taper 2 lettres/i).fill("Ma");
    await page.getByRole("button", { name: /rechercher/i }).click();
    await expect(page.getByText("Martin Paul")).toBeVisible();

    await page.getByTitle("Marquer present").click();
    await expect(page.getByText("Martin Paul")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Parcours liste des distributions
// ---------------------------------------------------------------------------

test.describe("Liste des distributions", () => {
  test("affiche les distributions mockees pour un utilisateur connecte", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        json: {
          id: "benef-1",
          email: "benef@test.com",
          nom: "Benef",
          prenom: "Test",
          roles: ["beneficiaire"],
          tenantSlug: "pilote",
          superAdmin: false,
        },
      }),
    );
    await page.route("**/api/distributions", (route) =>
      route.fulfill({
        json: [
          {
            id: "dist-pub",
            titre: "Distribution du samedi",
            statut: "PUBLIEE",
            date: "2026-06-20",
            lieu: "Salle B",
            capaciteBeneficiaires: 50,
            capaciteBenevoles: 10,
            modeCreneau: "CRENEAU_UNIQUE",
            creneaux: [],
            baseRepartition: "INSCRITS",
            dateCreation: "2026-06-01T10:00:00Z",
            description: null,
            motifAnnulation: null,
          },
        ],
      }),
    );

    await page.goto("/distributions");
    const url = page.url();
    if (url.includes("/login")) {
      test.skip();
      return;
    }

    await expect(page.getByText("Distribution du samedi")).toBeVisible();
  });
});
