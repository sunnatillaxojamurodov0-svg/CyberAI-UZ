import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { serviceUnavailableText, textError } from "@/lib/api-response";

export const Route = createFileRoute("/api/auth/github")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const env = getEnv();
          const clientId = env.GITHUB_CLIENT_ID as string;
          if (!clientId) {
            return serviceUnavailableText("GitHub OAuth is not configured.");
          }

          const origin = new URL(request.url).origin;
          const redirectUri = `${origin}/auth/callback`;
          const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github_${crypto.randomUUID()}`;

          return new Response(null, {
            status: 302,
            headers: { Location: url },
          });
        } catch {
          return textError("GitHub OAuth error.", 500);
        }
      },
    },
  },
});
