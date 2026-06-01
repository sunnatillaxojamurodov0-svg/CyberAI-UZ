import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

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
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authError: string | null;
  clearError: () => void;
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

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      setAuthError(null);
      try {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!data.ok) {
          setAuthError(data.error ?? "Login failed.");
          return data.error ?? "Login failed.";
        }
        setUser(data.user);
        setAuthModalOpen(false);
        return null;
      } catch {
        setAuthError("Network error. Please try again.");
        return "Network error. Please try again.";
      }
    },
    [],
  );

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
        setUser(data.user);
        setAuthModalOpen(false);
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

  const signInWithGoogle = useCallback(async () => {
    setAuthError("Google sign-in is not available. Use email and password instead.");
  }, []);

  const resetPassword = useCallback(
    async (_email: string): Promise<string | null> => {
      setAuthError("Password reset is not available yet.");
      return "Password reset is not available yet.";
    },
    [],
  );

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
        signInWithGoogle,
        resetPassword,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => {
          setAuthModalOpen(false);
          setAuthError(null);
        },
        authModalOpen,
        authError,
        clearError,
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
