import { apiFetch } from "@/lib/api";

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

export function envoyerEmailLibre(payload: EmailLibrePayload): Promise<void> {
  return apiFetch<void>("/api/notifications/email-libre", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
