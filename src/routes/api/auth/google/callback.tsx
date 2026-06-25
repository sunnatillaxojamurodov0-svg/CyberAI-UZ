import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { signInWithGoogle, setSessionCookie } from "@/lib/auth/auth-server";
import { jsonOk, jsonError, serverError } from "@/lib/api-response";
import { triggerOnboarding } from "@/lib/api-onboarding";

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
            return jsonError("No code provided.");
          }

          const result = await signInWithGoogle(code, redirectUri);
          if (!result.ok || !result.token) {
            return jsonError(result.error ?? "Google sign-in failed.", 401);
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
          return serverError("Google authentication error.");
        }
      },
    },
  },
});
