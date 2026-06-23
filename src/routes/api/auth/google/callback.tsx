import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { signInWithGoogle, setSessionCookie } from "@/lib/auth/auth-server";
import { getEnv } from "@/lib/db";

export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { code, redirectUri } = (await request.json()) as {
            code?: string;
            redirectUri?: string;
          };
          if (!code) {
            return new Response(JSON.stringify({ ok: false, error: "No code provided." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await signInWithGoogle(code, redirectUri);
          if (!result.ok || !result.token) {
            return new Response(
              JSON.stringify({ ok: false, error: result.error ?? "Google sign-in failed." }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const env = getEnv();
          const onboarding = env.USER_ONBOARDING as { create: (opts: { id: string; params: Record<string, unknown> }) => Promise<unknown> } | undefined;
          if (onboarding && result.user?.id) {
            onboarding.create({
              id: `onboard-${result.user.id}`,
              params: {
                userId: result.user.id,
                email: result.user.email,
                name: result.user.name ?? "User",
              },
            }).catch(() => {});
          }

          return new Response(JSON.stringify({ ok: true, user: result.user }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": setSessionCookie(result.token),
            },
          });
        } catch {
          return new Response(
            JSON.stringify({ ok: false, error: "Google authentication error." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
