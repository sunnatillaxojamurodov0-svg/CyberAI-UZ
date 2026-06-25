import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { signInWithGithub, setSessionCookie } from "@/lib/auth/auth-server";
import { jsonOk, jsonError, serverError } from "@/lib/api-response";
import { triggerOnboarding } from "@/lib/api-onboarding";

export const Route = createFileRoute("/api/auth/github/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { code } = (await request.json()) as { code?: string };
          if (!code) {
            return jsonError("No code provided.");
          }

          const result = await signInWithGithub(code);
          if (!result.ok || !result.token) {
            return jsonError(result.error ?? "GitHub sign-in failed.", 401);
          }

          if (result.user) {
            triggerOnboarding(result.user);
          }

          return jsonOk(
            { user: result.user },
            {
              "Set-Cookie": setSessionCookie(result.token),
            },
          );
        } catch {
          return serverError("GitHub authentication error.");
        }
      },
    },
  },
});
