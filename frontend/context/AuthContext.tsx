"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/types/api";
import { setAccessToken } from "@/lib/api-client";

interface AuthResponseData {
  user: User;
  accessToken: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    institution?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrapSession() {
      try {
        const response = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });

        if (!response.ok) {
          if (!isCancelled) {
            setAccessToken(null);
            setUser(null);
          }
          return;
        }

        const resData: ApiEnvelope<AuthResponseData> = await response.json();
        if (!isCancelled) {
          if (resData.success && resData.data?.accessToken) {
            setAccessToken(resData.data.accessToken);
            setUser(resData.data.user);
          } else {
            setAccessToken(null);
            setUser(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });

      if (!response.ok) {
        setAccessToken(null);
        setUser(null);
        return;
      }

      const resData: ApiEnvelope<AuthResponseData> = await response.json();
      if (resData.success && resData.data?.accessToken) {
        setAccessToken(resData.data.accessToken);
        setUser(resData.data.user);
      } else {
        setAccessToken(null);
        setUser(null);
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return {
          success: false,
          error: `Backend server error (${response.status}). Please ensure the Web Backend is running on port 5000.`,
        };
      }

      const resData: ApiEnvelope<AuthResponseData> = await response.json();

      if (!response.ok || !resData.success || !resData.data) {
        let errorMsg = resData.error?.message || resData.message;
        if (Array.isArray(resData.error?.details) && resData.error.details.length > 0) {
          errorMsg = (resData.error.details as any[])
            .map((d) => d.message || d.field)
            .join(". ");
        }
        return {
          success: false,
          error: errorMsg || `Authentication failed with status ${response.status}`,
        };
      }

      setAccessToken(resData.data.accessToken);
      setUser(resData.data.user);
      return { success: true };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Unable to reach authentication service. Ensure backend is running on port 5000.";
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    institution?: string;
  }) => {
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return {
          success: false,
          error: `Backend server error (${response.status}). Please ensure the Web Backend is running on port 5000.`,
        };
      }

      const resData: ApiEnvelope<AuthResponseData> = await response.json();

      if (!response.ok || !resData.success || !resData.data) {
        let errorMsg = resData.error?.message || resData.message;
        if (Array.isArray(resData.error?.details) && resData.error.details.length > 0) {
          errorMsg = (resData.error.details as any[])
            .map((d) => d.message || d.field)
            .join(". ");
        }
        return {
          success: false,
          error: errorMsg || `Registration failed with status ${response.status}`,
        };
      }

      setAccessToken(resData.data.accessToken);
      setUser(resData.data.user);
      return { success: true };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Unable to reach registration service. Ensure backend is running on port 5000.";
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
    } catch {
      // Ignore network errors during logout
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
