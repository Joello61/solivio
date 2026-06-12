export type CibleEmail =
  | "BENEVOLES"
  | "BENEFICIAIRES"
  | "COORDINATEURS"
  | "RESPONSABLES"
  | "TOUS";

export interface EmailLibrePayload {
  cible: CibleEmail;
  sujet: string;
  corps: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      detail?: string;
      message?: string;
    };
    throw Object.assign(
      new Error(err.detail ?? err.message ?? "Erreur reseau"),
      err,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function envoyerEmailLibre(payload: EmailLibrePayload): Promise<void> {
  return request<void>("/api/notifications/email-libre", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
