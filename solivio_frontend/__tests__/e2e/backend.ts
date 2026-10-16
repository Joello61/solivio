import { expect, request, type APIRequestContext, type Page, type TestType } from "@playwright/test";

// Backend joint en direct par les tests (preparation des donnees, verifications).
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080";
// Comptes du profil seed (DataSeeder), sans valeur hors developpement.
export const MOT_DE_PASSE_SEED = process.env.E2E_PASSWORD ?? "Solivio2026!";
// Lien vers la fiche d'une distribution, hors creation, duplication et jour J
// (la barre laterale propose le jour J les jours de distribution).
export const CARTE_DISTRIBUTION =
  "main a[href^='/distributions/']:not([href^='/distributions/nouvelle']):not([href$='/pointage'])";

export async function backendDisponible(): Promise<boolean> {
  try {
    const contexte = await request.newContext();
    const reponse = await contexte.get(`${API_URL}/api/public/config`).catch(() => null);
    await contexte.dispose();
    return reponse !== null;
  } catch {
    return false;
  }
}

/**
 * En CI, le backend est demarre par le job : son absence est une panne, pas une
 * raison de sauter les parcours critiques. En local, le test est saute.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exigerBackend(test: TestType<any, any>): Promise<void> {
  if (await backendDisponible()) return;
  if (process.env.CI) throw new Error(`Backend injoignable sur ${API_URL}`);
  test.skip(true, "Backend non disponible : lancer docker compose et le backend en profil dev,seed");
}

/** Contexte API authentifie (cookies) pour un compte du seed. */
export async function sessionApi(email: string): Promise<APIRequestContext> {
  const contexte = await request.newContext({ baseURL: API_URL });
  const reponse = await contexte.post("/api/auth/login", {
    data: { email, motDePasse: MOT_DE_PASSE_SEED, rememberMe: false },
  });
  if (!reponse.ok()) throw new Error(`Connexion API refusee pour ${email} : ${reponse.status()}`);
  return contexte;
}

export async function seConnecter(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(MOT_DE_PASSE_SEED);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

/** Date du jour a Paris (format ISO), comme l'horloge de l'association. */
export function aujourdhuiAParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/**
 * Garantit une distribution publiee a venir, en tete de la liste du coordinateur
 * (tri par date decroissante), pour les parcours qui partent de la liste.
 */
export async function assurerDistributionPubliee(): Promise<string> {
  const coordo = await sessionApi(process.env.E2E_EMAIL ?? "coordo1@solivio.app");
  try {
    const date = new Date(Date.now() + 60 * 24 * 3600 * 1000);
    const creation = await coordo.post("/api/distributions", {
      data: {
        titre: `Distribution e2e ${Date.now()}`,
        date: new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(date),
        capaciteBeneficiaires: 20,
        capaciteBenevoles: 5,
        modeCreneau: "CRENEAU_UNIQUE",
        creneaux: [{ heureDebut: "17:00", heureFin: "19:00", capacite: 20 }],
      },
    });
    if (!creation.ok()) throw new Error(`Creation de distribution refusee : ${await creation.text()}`);
    const { id } = (await creation.json()) as { id: string };
    const publication = await coordo.post(`/api/distributions/${id}/publier`);
    if (!publication.ok()) throw new Error(`Publication refusee : ${await publication.text()}`);
    return id;
  } finally {
    await coordo.dispose();
  }
}

/** Saute le test en local ; en CI, ou tout est fourni, une absence est une panne. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sauterHorsCi(test: TestType<any, any>, raison: string): void {
  if (process.env.CI) throw new Error(`Prerequis absent en CI : ${raison}`);
  test.skip(true, raison);
}

/*
 * Attend que la liste soit rendue, avec une carte ou le message vide, puis dit si elle a
 * des distributions. isVisible() ne patiente pas : appele trop tot, il concluait a une
 * liste vide.
 */
export async function listeChargee(page: Page): Promise<boolean> {
  const carte = page.locator(CARTE_DISTRIBUTION).first();
  await expect(carte.or(page.getByText(/aucune distribution/i).first())).toBeVisible();
  return carte.isVisible();
}
