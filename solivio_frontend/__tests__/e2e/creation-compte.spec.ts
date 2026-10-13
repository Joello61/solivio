import { test, expect, type APIRequestContext } from "@playwright/test";

// Parcours complet de creation de compte, sans session prealable : inscription,
// connexion refusee tant que l'email n'est pas verifie (redirection vers la saisie
// du code, nouveau code envoye), lecture du code dans Mailpit, verification, puis
// connexion. Rien n'est simule : backend reel et emails reels captes par Mailpit.
//
// Prerequis : backend et frontend demarres, Mailpit joignable (E2E_MAILPIT_URL,
// par exemple http://localhost:8025). Sans cette variable, le parcours est ignore.

const MAILPIT_URL = process.env.E2E_MAILPIT_URL;
const MOT_DE_PASSE = "Solivio-E2E-2026!";

type MessageMailpit = { ID: string; Created: string };

async function messagesDeVerification(request: APIRequestContext, email: string) {
  const query = encodeURIComponent(`to:"${email}" subject:"Verifiez votre email"`);
  const reponse = await request.get(`${MAILPIT_URL}/api/v1/search?query=${query}`);
  expect(reponse.ok()).toBeTruthy();
  const corps = (await reponse.json()) as { messages: MessageMailpit[] };
  return corps.messages;
}

// Attend le n-ieme email de verification et renvoie le code du plus recent : un
// nouvel envoi rend le code precedent caduc.
async function codeDuDernierEmail(request: APIRequestContext, email: string, attendus: number) {
  await expect
    .poll(async () => (await messagesDeVerification(request, email)).length, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(attendus);

  const messages = await messagesDeVerification(request, email);
  const plusRecent = [...messages].sort((a, b) => b.Created.localeCompare(a.Created))[0];
  const detail = await request.get(`${MAILPIT_URL}/api/v1/message/${plusRecent.ID}`);
  const { Text } = (await detail.json()) as { Text: string };
  const code = Text.match(/\b(\d{6})\b/)?.[1];
  expect(code, "code a 6 chiffres dans l'email").toBeTruthy();
  return code as string;
}

test.describe("Creation de compte", () => {
  test.skip(!MAILPIT_URL, "E2E_MAILPIT_URL non defini : Mailpit requis pour lire le code");

  test("inscription, verification de l'email apres une connexion refusee, puis connexion", async ({
    page,
    request,
  }) => {
    const email = `e2e-${Date.now()}@example.com`;

    // 1. Inscription : la page de saisie du code s'affiche.
    await page.goto("/register");
    await page.getByLabel("Prénom").fill("Camille");
    await page.getByLabel("Nom", { exact: true }).fill("Essai");
    await page.getByLabel("Adresse email").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page).toHaveURL(/\/verify-email\?email=/);
    await codeDuDernierEmail(request, email, 1);

    // 2. Connexion avant verification : redirection vers la saisie du code,
    //    avec un nouveau code envoye.
    await page.goto("/login");
    await page.getByLabel("Adresse email").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/verify-email\?.*raison=non-verifie/);
    await expect(page.getByRole("status")).toContainText("pas encore vérifiée");

    // 3. Saisie du dernier code recu.
    const code = await codeDuDernierEmail(request, email, 2);
    for (const [i, chiffre] of code.split("").entries()) {
      await page.getByLabel(`Chiffre ${i + 1}`).fill(chiffre);
    }
    await page.getByRole("button", { name: "Valider le code" }).click();

    await expect(page).toHaveURL(/\/login\?verified=1/);
    await expect(page.getByRole("status")).toContainText("Adresse email vérifiée");

    // 4. Connexion reussie.
    await page.getByLabel("Adresse email").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});
