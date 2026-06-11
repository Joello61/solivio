import { apiGet, apiPost } from "./api";
import type { MeResponse, TokenResponse } from "@/types/auth";

export const AUTH_LOGIN_URL =
  process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "http://localhost:8080/oauth2/authorization/google";

export async function login(email: string, motDePasse: string, rememberMe: boolean): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/auth/login", { email, motDePasse, rememberMe });
}

export async function logout(): Promise<void> {
  return apiPost<void>("/api/auth/logout", {});
}

export async function getMe(): Promise<MeResponse> {
  return apiGet<MeResponse>("/api/auth/me");
}

export async function register(payload: {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  codeAssociation?: string;
  tokenInvitation?: string;
}): Promise<void> {
  return apiPost<void>("/api/auth/register", payload);
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  return apiPost<void>("/api/auth/verify-email", { email, code });
}

export async function forgotPassword(email: string): Promise<void> {
  return apiPost<void>("/api/auth/forgot-password", { email });
}

export async function resetPassword(email: string, code: string, nouveauMotDePasse: string): Promise<void> {
  return apiPost<void>("/api/auth/reset-password", { email, code, nouveauMotDePasse });
}

export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/auth/refresh", { refreshToken });
}

export async function switchTenant(tenantSlug: string): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/auth/switch-tenant", { tenantSlug });
}

export async function completerInscriptionGoogle(payload: {
  email: string;
  nom: string;
  prenom: string;
  codeAssociation?: string;
  tokenInvitation?: string;
}): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/auth/google/complete-registration", payload);
}
