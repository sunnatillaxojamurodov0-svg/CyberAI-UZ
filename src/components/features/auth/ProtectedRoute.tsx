import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Fallback to render while session is loading (avoid flash) */
  fallback?: ReactNode;
}

/**
 * Wraps child components that require authentication.
 * If the user is not signed in, it opens the auth modal automatically.
 * Once signed in, the children render normally.
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading, openAuthModal } = useAuth();

  if (loading) {
    return fallback ?? null;
  }

  if (!user) {
    /* open the modal on next tick so it doesn't block render */
    queueMicrotask(() => openAuthModal());
    return null;
  }

  return <>{children}</>;
}
