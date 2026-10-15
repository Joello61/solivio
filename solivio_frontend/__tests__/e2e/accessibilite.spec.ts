import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { assurerDistributionPubliee, exigerBackend, sessionApi } from "./backend";

// Audit WCAG 2.2 AA (axe) des ecrans principaux, par role, en clair et en sombre.
const NORMES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// Comptes du DataSeeder en CI ; A11Y_COMPTES (JSON) les remplace en local.
const COMPTES: Record<string, string> = process.env.A11Y_COMPTES
  ? JSON.parse(process.env.A11Y_COMPTES)
  : {
      beneficiaire: "benef1@solivio.app",
      benevole: "benevole1@solivio.app",
      coordinateur: "coordo1@solivio.app",
      responsable: "resp1@solivio.app",
      superAdmin: "superadmin@solivio.app",
    };

const PAGES_PUBLIQUES = ["/", "/login", "/register", "/forgot-password"];

function pagesParRole(distribution: string): Record<string, string[]> {
  return {
    beneficiaire: ["/dashboard", "/distributions", `/distributions/${distribution}`, "/mes-inscriptions", "/mon-compte", "/mon-compte/profil-beneficiaire"],
    benevole: ["/dashboard", "/distributions", "/mes-inscriptions", "/missions-collecte", "/evenements", "/reconditionnement"],
    coordinateur: [
      "/dashboard",
      "/distributions",
      `/distributions/${distribution}`,
      `/distributions/${distribution}/pointage`,
      `/distributions/${distribution}/repartition`,
      "/distributions/nouvelle",
      "/statistiques",
      "/association/roles-benevoles",
    ],
    responsable: [
      "/association/membres",
      "/association/configuration",
      "/association/catalogue-denrees",
      "/notifications/email-libre",
      "/evenements/nouveau",
      "/reconditionnement/nouvelle",
      "/missions-collecte",
    ],
    superAdmin: ["/admin/utilisateurs"],
  };
}

type Theme = "light" | "dark";

async function ouvrir(browser: Browser, theme: Theme, email?: string): Promise<Page> {
  const storageState = email ? await (await sessionApi(email)).storageState() : undefined;
  const contexte = await browser.newContext({ storageState, colorScheme: theme });
  await contexte.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
  return contexte.newPage();
}

async function auditer(page: Page, chemin: string): Promise<void> {
  await page.goto(chemin, { waitUntil: "networkidle" });
  await expect(page.locator("body")).not.toBeEmpty();
  const { violations } = await new AxeBuilder({ page }).withTags(NORMES).analyze();
  const resume = violations.map((v) => ({
    regle: v.id,
    impact: v.impact,
    cibles: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
  }));
  expect.soft(resume, `${chemin} : ${violations.map((v) => v.help).join(" ; ")}`).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`Accessibilite, theme ${theme}`, () => {
    test("pages publiques", async ({ browser }) => {
      const page = await ouvrir(browser, theme);
      for (const chemin of PAGES_PUBLIQUES) await auditer(page, chemin);
    });

    test("pages protegees, par role", async ({ browser }) => {
      test.setTimeout(240_000);
      await exigerBackend(test);
      // En local, une distribution existante evite d'ecrire dans la base de demo.
      const distribution = process.env.A11Y_DISTRIBUTION ?? (await assurerDistributionPubliee());
      for (const [role, pages] of Object.entries(pagesParRole(distribution))) {
        if (!COMPTES[role]) continue;
        const page = await ouvrir(browser, theme, COMPTES[role]);
        for (const chemin of pages) {
          await test.step(`${role} ${chemin}`, () => auditer(page, chemin));
        }
        await page.context().close();
      }
    });
  });
}
