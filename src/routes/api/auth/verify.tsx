import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { verifyEmail } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/auth/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return new Response(JSON.stringify({ ok: false, error: "Token is required." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await verifyEmail(token);

          if (!result.ok) {
            return new Response(JSON.stringify({ ok: false, error: result.error }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({ ok: true, message: "Email verified successfully." }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          console.error("Email verification failed:", err);
          return new Response(JSON.stringify({ ok: false, error: "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
