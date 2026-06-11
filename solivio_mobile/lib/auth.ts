import { apiGet, apiPost, setTokens, clearTokens } from './api';
import type { MeResponse, TokenResponse } from '@/types/auth';

export async function login(
  email: string,
  motDePasse: string,
  rememberMe: boolean,
): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/api/auth/login', { email, motDePasse, rememberMe });
  await setTokens(data.accessToken, data.refreshToken ?? undefined);
  return data;
}

export async function logout(): Promise<void> {
  await apiPost<void>('/api/auth/logout', {}).catch(() => {});
  await clearTokens();
}

export async function getMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/api/auth/me');
}

export async function register(payload: {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  codeAssociation?: string;
  tokenInvitation?: string;
}): Promise<void> {
  return apiPost<void>('/api/auth/register', payload);
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  return apiPost<void>('/api/auth/verify-email', { email, code });
}

export async function forgotPassword(email: string): Promise<void> {
  return apiPost<void>('/api/auth/forgot-password', { email });
}

export async function resetPassword(
  email: string,
  code: string,
  nouveauMotDePasse: string,
): Promise<void> {
  return apiPost<void>('/api/auth/reset-password', { email, code, nouveauMotDePasse });
}

export async function switchTenant(tenantSlug: string): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/api/auth/switch-tenant', { tenantSlug });
  await setTokens(data.accessToken, data.refreshToken ?? undefined);
  return data;
}

export async function completerInscriptionGoogle(payload: {
  email: string;
  nom: string;
  prenom: string;
  codeAssociation?: string;
  tokenInvitation?: string;
}): Promise<TokenResponse> {
  return apiPost<TokenResponse>('/api/auth/google/complete-registration', payload);
}
