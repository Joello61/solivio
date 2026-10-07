import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "@/lib/api";

function mockFetch(responses: Array<{ ok: boolean; status: number; body?: unknown }>) {
  let call = 0;
  return vi.fn().mockImplementation(() => {
    const r = responses[call] ?? responses[responses.length - 1];
    call++;
    return Promise.resolve({
      ok: r.ok,
      status: r.status,
      json: () => Promise.resolve(r.body ?? {}),
    });
  });
}

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset la promise de refresh partagee entre les appels.
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("retourne les donnees JSON en cas de succes", async () => {
    global.fetch = mockFetch([{ ok: true, status: 200, body: { id: 1, nom: "Alice" } }]);
    const result = await apiFetch<{ id: number; nom: string }>("/api/test");
    expect(result).toEqual({ id: 1, nom: "Alice" });
  });

  it("retourne undefined pour une reponse 204 No Content", async () => {
    global.fetch = mockFetch([{ ok: true, status: 204, body: undefined }]);
    const result = await apiFetch<void>("/api/test");
    expect(result).toBeUndefined();
  });

  it("leve une erreur avec le message, le code et le request_id du backend", async () => {
    global.fetch = mockFetch([
      {
        ok: false,
        status: 400,
        body: {
          error: { code: "VALIDATION_FAILED", message: "Champ requis", request_id: "req-1234" },
        },
      },
    ]);
    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      status: 400,
      message: "Champ requis",
      detail: "Champ requis",
      code: "VALIDATION_FAILED",
      requestId: "req-1234",
    });
  });

  it("leve une erreur generique si le corps n'est pas du JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    });
    await expect(apiFetch("/api/test")).rejects.toMatchObject({ status: 500 });
  });

  it("sur 401 : tente un refresh puis rejoue la requete", async () => {
    // 1er appel : 401 (token expire)
    // 2e appel : refresh -> 200
    // 3e appel : retry requete originale -> 200
    global.fetch = mockFetch([
      { ok: false, status: 401, body: { error: { code: "UNAUTHENTICATED", message: "Authentification requise." } } },
      { ok: true, status: 200, body: {} },       // refresh
      { ok: true, status: 200, body: { id: 2 } }, // retry
    ]);

    const result = await apiFetch<{ id: number }>("/api/test");
    expect(result).toEqual({ id: 2 });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    // Le 2e appel doit cibler le endpoint de refresh.
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][0]).toContain(
      "/api/auth/refresh",
    );
  });

  it("sur 401 + refresh echoue : leve une erreur de session expiree", async () => {
    global.fetch = mockFetch([
      { ok: false, status: 401, body: { error: { code: "UNAUTHENTICATED", message: "Authentification requise." } } },
      { ok: false, status: 401, body: { error: { code: "UNAUTHENTICATED", message: "Session expiree." } } }, // refresh echoue
    ]);

    // window.location.href = '/login' ne peut pas etre teste en jsdom sans mock.
    Object.defineProperty(global, "window", {
      value: { location: { href: "" } },
      writable: true,
    });

    await expect(apiFetch("/api/test")).rejects.toMatchObject({ status: 401 });
    expect(global.window.location.href).toBe("/login");
  });

  it("ne tente pas un refresh si le path est /api/auth/refresh", async () => {
    global.fetch = mockFetch([
      { ok: false, status: 401, body: { error: { code: "UNAUTHENTICATED", message: "Authentification requise." } } },
    ]);
    // Le refresh endpoint lui-meme retourne 401 -> doit lancer l'erreur sans boucle infinie.
    await expect(apiFetch("/api/auth/refresh")).rejects.toMatchObject({ status: 401 });
    // Un seul appel fetch (pas de tentative de refresh recursive).
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("ne tente pas un refresh si noCredentials est true", async () => {
    global.fetch = mockFetch([
      { ok: false, status: 401, body: { error: { code: "UNAUTHENTICATED", message: "Authentification requise." } } },
    ]);
    await expect(apiFetch("/api/test", { noCredentials: true })).rejects.toMatchObject({
      status: 401,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
