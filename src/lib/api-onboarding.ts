import type { AuthUser } from "@/lib/auth/auth-server";
import { getEnv } from "@/lib/db";

export function triggerOnboarding(user: AuthUser): void {
  try {
    const env = getEnv();
    const onboarding = env.USER_ONBOARDING as
      | {
          create: (opts: { id: string; params: Record<string, unknown> }) => Promise<unknown>;
        }
      | undefined;
    if (onboarding && user.id) {
      onboarding
        .create({
          id: `onboard-${user.id}`,
          params: {
            userId: user.id,
            email: user.email,
            name: user.name ?? "User",
          },
        })
        .catch(() => {});
    }
  } catch {
    /* non-fatal */
  }
}
