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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch current session user
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[AUTH_PROVIDER] Failed to fetch session:", err);
      setUser(null);
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
