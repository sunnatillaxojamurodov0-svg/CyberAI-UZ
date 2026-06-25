import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const env = getEnv();
          const clientId = env.GOOGLE_CLIENT_ID as string;
          if (!clientId) {
            return new Response("Google OAuth is not configured.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const origin = new URL(request.url).origin;
          const redirectUri = `${origin}/auth/callback`;
          const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=google_${crypto.randomUUID()}`;

          return new Response(null, {
            status: 302,
            headers: { Location: url },
          });
        } catch (err) {
          console.error("Google OAuth redirect error:", err);
          return new Response("Google OAuth error.", { status: 500 });
        }
      },
    },
  },
});
