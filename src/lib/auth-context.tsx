import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: null;
  loading: boolean;
  signIn: (email: string, password: string, totpToken?: string) => Promise<string | null>;
  signUp: (email: string, password: string, username?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  signInWithGithub: () => void;
  signInWithGoogle: () => void;
  resetPassword: (email: string) => Promise<string | null>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authError: string | null;
  clearError: () => void;
  requires2FA: boolean;
  setRequires2FA: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { ok: boolean; user: AuthUser | null }) => {
        if (data.ok && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string, totpToken?: string): Promise<string | null> => {
    setAuthError(null);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, totpToken }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setAuthError("Enter your two-factor authentication code.");
          return null;
        }
        if (data.requiresVerification) {
          setAuthError("Please verify your email first. Check your inbox for the verification link.");
        } else if (data.locked) {
          setAuthError(data.error ?? "Account locked due to too many failed attempts.");
        } else {
          setAuthError(data.error ?? "Login failed.");
        }
        return data.error ?? "Login failed.";
      }
      setUser(data.user);
      setAuthModalOpen(false);
      setRequires2FA(false);
      return null;
    } catch {
      setAuthError("Network error. Please try again.");
      return "Network error. Please try again.";
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username?: string): Promise<string | null> => {
      setAuthError(null);
      try {
        const res = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, name: username }),
        });
        const data = await res.json();
        if (!data.ok) {
          setAuthError(data.error ?? "Registration failed.");
          return data.error ?? "Registration failed.";
        }
        setAuthError(null);
        setAuthModalOpen(false);
        setAuthError("Verification email sent! Please check your inbox and verify your email before logging in.");
        return null;
      } catch {
        setAuthError("Network error. Please try again.");
        return "Network error. Please try again.";
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const signInWithGithub = useCallback(() => {
    window.location.href = "/api/auth/github";
  }, []);

  const signInWithGoogle = useCallback(() => {
    window.location.href = "/api/auth/google";
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    setAuthError(null);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAuthError(data.error ?? "Failed to send reset link.");
        return data.error ?? "Failed to send reset link.";
      }
      return null;
    } catch {
      setAuthError("Network error. Please try again.");
      return "Network error. Please try again.";
    }
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGithub,
        signInWithGoogle,
        resetPassword,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => {
          setAuthModalOpen(false);
          setAuthError(null);
          setRequires2FA(false);
        },
        authModalOpen,
        authError,
        clearError,
        requires2FA,
        setRequires2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
