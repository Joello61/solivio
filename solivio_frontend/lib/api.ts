const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type FetchOptions = RequestInit & { noCredentials?: boolean };

/**
 * Fetch wrapper pour les appels au backend Spring Boot.
 * Inclut les cookies automatiquement (credentials: 'include') pour l'auth BFF.
 * Leve une erreur si le statut HTTP >= 400.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { noCredentials, ...init } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: noCredentials ? "omit" : "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ title: "Erreur serveur", status: response.status }));
    const error = Object.assign(new Error(body.detail ?? body.title ?? "Erreur"), {
      status: response.status,
      title: body.title,
      detail: body.detail,
    });
    throw error;
  }

  // 204 No Content
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
