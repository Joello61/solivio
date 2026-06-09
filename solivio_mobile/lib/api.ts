import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export function buildImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${API_URL}${path}`;
}

export const STORAGE_KEY_ACCESS_TOKEN = 'access_token';
export const STORAGE_KEY_REFRESH_TOKEN = 'refresh_token';

// Concurrent-safe : un seul refresh meme si plusieurs requetes recoivent 401.
let refreshPromise: Promise<boolean> | null = null;

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEY_ACCESS_TOKEN);
}

export async function setTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY_ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY_ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEY_REFRESH_TOKEN);
}

async function buildHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function tentativeRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEY_REFRESH_TOKEN);
        if (!refreshToken) return false;

        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        await setTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function parseErrorResponse(body: unknown, status: number): Error {
  const b = body as { title?: string; detail?: string } | null;
  return Object.assign(new Error(b?.detail ?? b?.title ?? 'Erreur'), {
    status,
    title: b?.title,
    detail: b?.detail,
  });
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isRefreshEndpoint = path === '/api/auth/refresh';
  const headers = await buildHeaders(init.headers as Record<string, string>);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (response.status === 401 && !isRefreshEndpoint) {
    const refreshed = await tentativeRefresh();

    if (refreshed) {
      const retryHeaders = await buildHeaders(init.headers as Record<string, string>);
      const retryResponse = await fetch(`${API_URL}${path}`, { ...init, headers: retryHeaders });
      if (retryResponse.ok) {
        if (retryResponse.status === 204) return undefined as T;
        return retryResponse.json() as Promise<T>;
      }
    }

    await clearTokens();
    router.replace('/(auth)/login');
    throw Object.assign(new Error('Session expiree'), { status: 401 });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseErrorResponse(body, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const buildUploadHeaders = async (): Promise<Record<string, string>> => {
    const token = await getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: await buildUploadHeaders(),
    body: formData,
  });

  if (response.status === 401) {
    const refreshed = await tentativeRefresh();
    if (refreshed) {
      const retryResponse = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: await buildUploadHeaders(),
        body: formData,
      });
      if (retryResponse.ok) {
        if (retryResponse.status === 204) return undefined as T;
        return retryResponse.json() as Promise<T>;
      }
    }
    await clearTokens();
    router.replace('/(auth)/login');
    throw Object.assign(new Error('Session expiree'), { status: 401 });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseErrorResponse(body, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
