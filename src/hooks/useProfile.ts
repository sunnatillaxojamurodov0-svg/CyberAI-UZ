import { useAuth } from "@/lib/auth-context";

export function useProfile() {
  const { user, loading } = useAuth();

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

  return {
    profile,
    loading,
    saving: false,
    error: null as string | null,
    refresh: async () => {},
    save: async () => null as string | null,
    changeAvatar: async () => null as string | null,
  };
}
