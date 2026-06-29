import { useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

export function useProfile() {
  const { user, loading, refreshUser } = useAuth();

  const profile = user
    ? {
        id: user.id,
        username: user.name ?? user.email.split("@")[0],
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: null as string | null,
        last_login_at: null as string | null,
      }
    : null;

  const refetch = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  return {
    profile,
    loading,
    saving: false,
    error: null as string | null,
    refetch,
  };
}
