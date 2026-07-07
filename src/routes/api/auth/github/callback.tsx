import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { signInWithGithub, setSessionCookie } from "@/lib/auth/auth-server";
import { getEnv } from "@/lib/db";

export const Route = createFileRoute("/api/auth/github/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { code } = (await request.json()) as { code?: string };
          if (!code) {
            return new Response(JSON.stringify({ ok: false, error: "No code provided." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await signInWithGithub(code);
          if (!result.ok || !result.token) {
            return new Response(
              JSON.stringify({ ok: false, error: result.error ?? "GitHub sign-in failed." }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const env = getEnv();
          const onboarding = env.USER_ONBOARDING as
            | {
                create: (opts: { id: string; params: Record<string, unknown> }) => Promise<unknown>;
              }
            | undefined;
          if (onboarding && result.user?.id) {
            onboarding
              .create({
                id: `onboard-${result.user.id}`,
                params: {
                  userId: result.user.id,
                  email: result.user.email,
                  name: result.user.name ?? "User",
                },
              })
              .catch(() => {});
          }

          return new Response(JSON.stringify({ ok: true, user: result.user }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": setSessionCookie(
                result.token,
                result.expiresAt
                  ? result.expiresAt - Math.floor(Date.now() / 1000)
                  : 7 * 24 * 60 * 60,
              ),
            },
          });
        } catch {
          return new Response(
            JSON.stringify({ ok: false, error: "GitHub authentication error." }),
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
