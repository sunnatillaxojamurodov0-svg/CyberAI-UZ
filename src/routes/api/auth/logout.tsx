import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { logoutUser, getSessionToken, clearSessionCookie } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (token) {
            await logoutUser(token);
          }
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": clearSessionCookie(),
            },
          });
        } catch (err) {
          console.error("Logout failed:", err);
          return new Response(JSON.stringify({ ok: false, error: "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
