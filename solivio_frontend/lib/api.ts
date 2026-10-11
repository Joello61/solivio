// Vide dans les images deployees : appels relatifs, sur le domaine de la page.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type FetchOptions = RequestInit & { noCredentials?: boolean };

// Un 401 de ces points d'entree publics est une reponse metier (identifiants
// refuses, jeton expire), pas une session expiree : ni rafraichissement ni
// redirection, l'erreur remonte au formulaire.
const ENDPOINTS_AUTH_PUBLICS = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google/complete-registration",
]);

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

// Rechargement complet volontaire apres une session expiree : il vide l'etat
// client et le cache des requetes. Hors composant, aucun routeur n'est disponible.
function allerALaConnexion(): void {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
}

// Un succes peut arriver sans corps, et pas seulement en 204 : l'inscription repond
// 201, le pointage ad hoc et l'email libre 200, sans contenu. response.json() echoue
// sur un corps vide.
async function lireCorps<T>(response: Response): Promise<T> {
  const texte = await response.text();
  return (texte ? JSON.parse(texte) : undefined) as T;
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
  const sansRafraichissement = ENDPOINTS_AUTH_PUBLICS.has(path);

  const response = await fetch(`${API_URL}${path}`, buildInit(init, noCredentials));

  // Token expire : on tente un refresh puis on rejoue la requete.
  if (response.status === 401 && !noCredentials && !sansRafraichissement) {
    const refreshed = await tentativeRefresh();

    if (refreshed) {
      const retryResponse = await fetch(`${API_URL}${path}`, buildInit(init, noCredentials));
      if (retryResponse.ok) {
        return lireCorps<T>(retryResponse);
      }
      // Le retry a aussi echoue : on laisse tomber vers la redirection.
    }

    // Refresh impossible (refresh token expire ou invalide) : retour au login.
    allerALaConnexion();
    throw Object.assign(new Error("Session expiree"), { status: 401 });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseErrorResponse(body, response.status);
  }

  return lireCorps<T>(response);
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
  return lireCorps<T>(await fetchBrut(path, init));
}

/** Telecharge un fichier binaire (export ZIP) sous forme de Blob. */
export async function apiTelecharger(path: string): Promise<Blob> {
  return (await fetchBrut(path, { method: "GET" })).blob();
}

async function fetchBrut(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: "include" });

  if (response.status === 401) {
    const refreshed = await tentativeRefresh();
    if (refreshed) {
      const retry = await fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
      if (retry.ok) {
        return retry;
      }
    }
    allerALaConnexion();
    throw Object.assign(new Error("Session expiree"), { status: 401 });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseErrorResponse(body, response.status);
  }

  return response;
}
