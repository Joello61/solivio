import { afterEach, describe, expect, it, vi } from "vitest";
import { lireProchainesDistributions } from "@/lib/api/public";

describe("lireProchainesDistributions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lit l'endpoint public avec une revalidation de cinq minutes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);

    await expect(lireProchainesDistributions()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/public\/distributions\/prochaines$/),
      { next: { revalidate: 300 } },
    );
  });

  it("renvoie null si le backend refuse ou ne repond pas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(lireProchainesDistributions()).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("injoignable")));
    await expect(lireProchainesDistributions()).resolves.toBeNull();
  });
});
