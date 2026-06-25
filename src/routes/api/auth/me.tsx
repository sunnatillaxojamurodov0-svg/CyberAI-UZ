import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { verifySession, getSessionToken } from "@/lib/auth/auth-server";
import { jsonResponse } from "@/lib/api-response";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return jsonResponse({ ok: false, user: null });
          }
          const result = await verifySession(token);
          return jsonResponse({ ok: result.ok, user: result.user ?? null });
        } catch (err) {
          return jsonResponse({ ok: false, user: null });
        }
      },
    },
  },
});
