import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [{ name: "access_token", value: "jeton" }] }),
}));

import { accesServeur, lireServeur } from "@/lib/api/serveur";

function reponse(status: number, corps: unknown = {}): Response {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

describe("lireServeur", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("transmet les cookies de la requete et renvoie le corps", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reponse(200, { id: "d1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(lireServeur<{ id: string }>("/api/distributions/d1")).resolves.toEqual({ id: "d1" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/distributions\/d1$/),
      { headers: { Cookie: "access_token=jeton" }, cache: "no-store" },
    );
  });

  it("renvoie null quand le backend refuse ou ne trouve pas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reponse(404)));
    await expect(lireServeur("/api/distributions/inconnue")).resolves.toBeNull();
  });
});

describe("accesServeur", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("dit si le backend autorise l'acces", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(reponse(200, [])).mockResolvedValueOnce(reponse(404)));
    await expect(accesServeur("/api/distributions/d1/pointage?q=")).resolves.toBe(true);
    await expect(accesServeur("/api/distributions/d2/pointage?q=")).resolves.toBe(false);
  });
});
