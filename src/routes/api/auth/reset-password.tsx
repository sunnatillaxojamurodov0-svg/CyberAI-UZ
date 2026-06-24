import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";

export const Route = createFileRoute("/api/auth/reset-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const rl = await checkRateLimit(rateLimitKey(ip, "reset"), "auth");
          if (!rl.allowed) {
            return new Response(
              JSON.stringify({ ok: false, error: "Too many attempts. Try again later." }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }

          const body = (await request.json()) as {
            email?: string;
            token?: string;
            newPassword?: string;
          };

          if (body.token && body.newPassword) {
            const { resetPassword } = await import("@/lib/auth/auth-server");
            const result = await resetPassword(body.token, body.newPassword);
            return new Response(JSON.stringify(result), {
              status: result.ok ? 200 : 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!body.email) {
            return new Response(JSON.stringify({ ok: false, error: "Email is required." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await createPasswordResetToken(body.email);
          if (result.ok && result.token) {
            sendPasswordResetEmail(body.email, result.token).catch(() => {});
          }

          return new Response(
            JSON.stringify({
              ok: true,
              message: "If an account exists, a reset link has been sent.",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
