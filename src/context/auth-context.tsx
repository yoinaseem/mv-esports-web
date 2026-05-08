"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { configureApiClient } from "@/lib/api-client";
import * as authApi from "@/lib/api/auth";
import type { LoginPayload, RegisterPayload } from "@/lib/api/auth";
import { clearStoredToken, readStoredToken, writeStoredToken } from "@/lib/auth-storage";
import type { AuthUser } from "@/types/auth";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Path prefixes that force a redirect to /login when a stale token gets cleared.
// Public/viewer pages stay reachable while unauthenticated. Extend this list
// as protected sections (admin, host dashboard, etc.) come online.
const PROTECTED_PATH_PREFIXES: string[] = [];

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const path = window.location.pathname;
  if (path === "/login") return;

  const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isProtected) return;

  window.location.assign("/login");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    tokenRef.current = nextToken;
    setUser(nextUser);
    writeStoredToken(nextToken);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    tokenRef.current = null;
    setUser(null);
    clearStoredToken();
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const response = await authApi.login(payload);
        applySession(response.token, response.user);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      try {
        const response = await authApi.register(payload);
        applySession(response.token, response.user);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    [applySession],
  );

  const refreshUser = useCallback(async () => {
    if (!tokenRef.current) return null;
    try {
      const next = await authApi.me(tokenRef.current);
      setUser(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (tokenRef.current) {
        await authApi.logout();
      }
    } catch {
      // Local auth state must still be cleared even when the API call fails.
    } finally {
      clearAuth();
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        clearAuth();
        redirectToLogin();
      },
    });
  }, [clearAuth]);

  useEffect(() => {
    const storedToken = readStoredToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    tokenRef.current = storedToken;

    const hydrateUser = async () => {
      try {
        const nextUser = await authApi.me(storedToken);
        setUser(nextUser);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    void hydrateUser();
  }, [clearAuth]);

  const hasRole = useCallback(
    (role: string) => user?.roles?.includes(role) ?? false,
    [user],
  );

  const hasPermission = useCallback(
    (permission: string) => user?.permissions?.includes(permission) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      register,
      logout,
      clearAuth,
      refreshUser,
      hasRole,
      hasPermission,
    }),
    [token, user, loading, login, register, logout, clearAuth, refreshUser, hasRole, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
