import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { verifySession, getSessionToken } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ ok: false, user: null }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
          const result = await verifySession(token);
          return new Response(JSON.stringify({ ok: result.ok, user: result.user ?? null }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Auth session verification failed:", err);
          return new Response(JSON.stringify({ ok: false, user: null }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
