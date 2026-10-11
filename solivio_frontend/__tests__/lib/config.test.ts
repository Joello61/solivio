import { afterEach, describe, expect, it, vi } from "vitest";

describe("lireCleGoogleMaps", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("charge la cle une seule fois", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ googleMapsApiKey: "cle" })));
    vi.stubGlobal("fetch", fetchMock);
    const { lireCleGoogleMaps } = await import("@/lib/api/config");

    await expect(lireCleGoogleMaps()).resolves.toBe("cle");
    await expect(lireCleGoogleMaps()).resolves.toBe("cle");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renvoie une cle vide si la configuration est indisponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("reseau")));
    const { lireCleGoogleMaps } = await import("@/lib/api/config");

    await expect(lireCleGoogleMaps()).resolves.toBe("");
  });
});
