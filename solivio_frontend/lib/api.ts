// Vide dans les images deployees : appels relatifs, sur le domaine de la page.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type FetchOptions = RequestInit & { noCredentials?: boolean };

// Promise partagee entre les requetes concurrentes : on ne refreshe qu'une seule fois
// meme si plusieurs requetes recoivent un 401 simultanement.
let refreshPromise: Promise<boolean> | null = null;

async function tentativeRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function buildInit(init: RequestInit, noCredentials: boolean): RequestInit {
  return {
    ...init,
    credentials: noCredentials ? "omit" : "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  };
}

type ApiErrorBody = {
  error?: { code?: string; message?: string; details?: unknown; request_id?: string };
};

/**
 * Convertit l'enveloppe d'erreur du backend ({"error": {code, message, details, request_id}})
 * en Error. `detail` reprend le message pour les composants qui l'affichent.
 */
export function parseErrorResponse(body: unknown, status: number): Error {
  const e = (body as ApiErrorBody | null)?.error;
  return Object.assign(new Error(e?.message ?? "Erreur"), {
    status,
    code: e?.code,
    detail: e?.message,
    details: e?.details,
    requestId: e?.request_id,
  });
}

/**
 * Fetch wrapper pour les appels au backend Spring Boot.
 * Inclut les cookies automatiquement (credentials: 'include') pour l'auth BFF.
 * Sur 401 : tente un refresh du token (une seule fois, concurrent-safe),
 * puis rejoue la requete. Si le refresh echoue, redirige vers /login.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { noCredentials = false, ...init } = options;
  const isRefreshEndpoint = path === "/api/auth/refresh";

  const response = await fetch(`${API_URL}${path}`, buildInit(init, noCredentials));

  // Token expire : on tente un refresh puis on rejoue la requete.
  if (response.status === 401 && !noCredentials && !isRefreshEndpoint) {
    const refreshed = await tentativeRefresh();

    if (refreshed) {
      const retryResponse = await fetch(`${API_URL}${path}`, buildInit(init, noCredentials));
      if (retryResponse.ok) {
        if (retryResponse.status === 204) return undefined as T;
        return retryResponse.json() as Promise<T>;
      }
      // Le retry a aussi echoue : on laisse tomber vers la redirection.
    }

    // Refresh impossible (refresh token expire ou invalide) : retour au login.
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw Object.assign(new Error("Session expiree"), { status: 401 });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseErrorResponse(body, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

/**
 * Fetch sans header Content-Type automatique, pour les envois multipart (FormData).
 * Le navigateur positionne lui-meme le boundary requis.
 */
export async function apiFetchRaw<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (response.status === 401) {
    const refreshed = await tentativeRefresh();
    if (refreshed) {
      const retry = await fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
      if (retry.ok) {
        if (retry.status === 204) return undefined as T;
        return retry.json() as Promise<T>;
      }
    }
    if (typeof window !== "undefined") window.location.href = "/login";
    throw Object.assign(new Error("Session expiree"), { status: 401 });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseErrorResponse(body, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
