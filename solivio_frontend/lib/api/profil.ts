import { apiFetch, apiFetchRaw } from "@/lib/api";
import type {
  UpdateProfilPayload,
  ProfilBeneficiaireResponse,
  UpdateProfilBeneficiairePayload,
  CompteAdminResponse,
} from "@/types/profil";
import type { MeResponse } from "@/types/auth";

export function mettreAJourProfil(payload: UpdateProfilPayload): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadAvatar(file: File): Promise<MeResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetchRaw<MeResponse>("/api/me/photo", {
    method: "POST",
    body: form,
  });
}

export function mettreAJourProfilBeneficiaire(
  payload: UpdateProfilBeneficiairePayload
): Promise<ProfilBeneficiaireResponse> {
  return apiFetch<ProfilBeneficiaireResponse>("/api/me/profil-beneficiaire", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// --- Admin ---

export function changerStatutCompte(id: string, actif: boolean): Promise<CompteAdminResponse> {
  return apiFetch<CompteAdminResponse>(`/api/admin/comptes/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ actif }),
  });
}

export function changerSuperAdmin(id: string, superAdmin: boolean): Promise<CompteAdminResponse> {
  return apiFetch<CompteAdminResponse>(`/api/admin/comptes/${id}/super-admin`, {
    method: "PATCH",
    body: JSON.stringify({ superAdmin }),
  });
}

export function supprimerCompteAdmin(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/comptes/${id}`, { method: "DELETE" });
}

/** Droit a l'effacement : supprime le compte et anonymise la personne. */
export function effacerMesDonnees(): Promise<void> {
  return apiFetch<void>("/api/me", { method: "DELETE" });
}

export function effacerDonneesCompteAdmin(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/comptes/${id}/effacement`, { method: "POST" });
}
