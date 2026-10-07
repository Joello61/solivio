import { parseErrorResponse } from "@/lib/api";
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
    throw parseErrorResponse(await res.json().catch(() => null), res.status);
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
