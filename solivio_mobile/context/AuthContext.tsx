import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAccessToken } from '@/lib/api';
import { getMe, logout as doLogout } from '@/lib/auth';
import type { MeResponse, TenantSummary } from '@/types/auth';

interface AuthState {
  user: MeResponse | null;
  tenants: TenantSummary[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setTenants: (tenants: TenantSummary[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady?: () => void;
}) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setUser(null);
    setTenants([]);
  }, []);

  useEffect(() => {
    refresh().finally(() => {
      setIsLoading(false);
      onReady?.();
    });
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tenants,
        isLoading,
        isAuthenticated: !!user,
        refresh,
        logout,
        setTenants,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext doit etre utilise dans AuthProvider');
  return ctx;
}
