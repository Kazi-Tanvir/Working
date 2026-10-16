"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  authProvider: string;
  createdAt: string | Date;
}

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  login: (credentials: { login: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  oauthLogin: (
    provider: "google" | "discord",
    payload?: { email?: string; name?: string; avatarUrl?: string; providerId?: string }
  ) => Promise<{ success: boolean; error?: string; needsUsername?: boolean; redirect?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SHINDB_CACHED_USER_KEY = "shindb_session_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronous cache hydration on mount to eliminate auth delay
  const [user, setUser] = useState<SafeUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(SHINDB_CACHED_USER_KEY);
        if (cached) return JSON.parse(cached);
      } catch (err) {
        console.warn("[AUTH_CACHE] Failed to parse cached session:", err);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return !localStorage.getItem(SHINDB_CACHED_USER_KEY);
      } catch {
        return true;
      }
    }
    return true;
  });

  const router = useRouter();

  const persistUserSession = (userData: SafeUser | null) => {
    if (typeof window === "undefined") return;
    try {
      if (userData) {
        localStorage.setItem(SHINDB_CACHED_USER_KEY, JSON.stringify(userData));
        document.cookie = "shindb_session_active=1; path=/; max-age=604800; SameSite=Lax";
      } else {
        localStorage.removeItem(SHINDB_CACHED_USER_KEY);
        document.cookie = "shindb_session_active=; path=/; max-age=0; SameSite=Lax";
      }
    } catch (e) {
      console.warn("[AUTH_CACHE] Storage access error:", e);
    }
  };

  // Fetch current session user with stale-while-revalidate
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        persistUserSession(data.user);
      } else if (res.status === 401) {
        setUser(null);
        persistUserSession(null);
      }
    } catch (err) {
      console.error("[AUTH_PROVIDER] Network error during session validation:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { login: string; password: string }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Authentication failed" };
      }

      setUser(data.user);
      persistUserSession(data.user);
      router.refresh();
      return { success: true };
    } catch {
      return { success: false, error: "Network error during authentication" };
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setUser(data.user);
      persistUserSession(data.user);
      router.refresh();
      return { success: true };
    } catch {
      return { success: false, error: "Network error during registration" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("[AUTH_LOGOUT_ERROR]", err);
    } finally {
      setUser(null);
      persistUserSession(null);
      router.push("/login");
      router.refresh();
    }
  };

  const oauthLogin = async (
    provider: "google" | "discord",
    payload?: { email?: string; name?: string; avatarUrl?: string; providerId?: string }
  ) => {
    try {
      const res = await fetch(`/api/auth/login/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || `${provider} authentication failed` };
      }

      if (data.needsUsername) {
        if (data.redirect) {
          router.push(data.redirect);
        }
        return { success: true, needsUsername: true, redirect: data.redirect };
      }

      setUser(data.user);
      persistUserSession(data.user);
      router.refresh();
      return { success: true };
    } catch {
      return { success: false, error: `Network error during ${provider} login` };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        oauthLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
