import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb } from "@/lib/db";
import {
  verifySession,
  getSessionToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";

export const Route = createFileRoute("/api/auth/change-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ ok: false, error: "Not authenticated." }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const session = await verifySession(token);
          if (!session.ok || !session.user) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid session." }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const rl = await checkRateLimit(rateLimitKey(ip, "auth"), "auth");
          if (!rl.allowed) {
            return new Response(
              JSON.stringify({ ok: false, error: "Too many attempts. Try again later." }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }

          const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
          if (!body.currentPassword || !body.newPassword) {
            return new Response(
              JSON.stringify({ ok: false, error: "Current and new passwords are required." }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (body.newPassword.length < 6) {
            return new Response(
              JSON.stringify({ ok: false, error: "New password must be at least 6 characters." }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const db = requireDb<D1Database>();
          const row = await db
            .prepare("SELECT password_hash FROM users WHERE id = ?")
            .bind(session.user.id)
            .first<{ password_hash: string }>();

          if (!row) {
            return new Response(JSON.stringify({ ok: false, error: "User not found." }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const valid = await verifyPassword(body.currentPassword, row.password_hash);
          if (!valid) {
            return new Response(
              JSON.stringify({ ok: false, error: "Current password is incorrect." }),
              { status: 403, headers: { "Content-Type": "application/json" } },
            );
          }

          const salt = crypto.randomUUID();
          const passwordHash = await hashPassword(body.newPassword, salt);
          await db
            .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
            .bind(passwordHash, Math.floor(Date.now() / 1000), session.user.id)
            .run();

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Change password error:", err);
          return new Response(JSON.stringify({ ok: false, error: "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
