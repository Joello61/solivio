import { apiFetch, apiFetchRaw, apiGet } from "@/lib/api";
import type {
  UpdateProfilPayload,
  ProfilBeneficiaireResponse,
  UpdateProfilBeneficiairePayload,
  CompteAdminResponse,
  PageResponse,
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

export function lireProfilBeneficiaire(): Promise<ProfilBeneficiaireResponse> {
  return apiGet<ProfilBeneficiaireResponse>("/api/me/profil-beneficiaire");
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

export function listerComptesAdmin(
  q?: string,
  page = 0,
  taille = 20
): Promise<PageResponse<CompteAdminResponse>> {
  const params = new URLSearchParams({ page: String(page), taille: String(taille) });
  if (q) params.set("q", q);
  return apiGet<PageResponse<CompteAdminResponse>>(`/api/admin/comptes?${params}`);
}

export function lireCompteAdmin(id: string): Promise<CompteAdminResponse> {
  return apiGet<CompteAdminResponse>(`/api/admin/comptes/${id}`);
}

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
