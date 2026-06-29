import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/user/settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const session = await verifySession(token);
          if (!session.ok || !session.user?.id) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = requireDb();
          const row = await db
            .prepare(
              "SELECT notif_email, notif_security, notif_updates FROM user_settings WHERE user_id = ?",
            )
            .bind(session.user.id)
            .first<{
              notif_email: number;
              notif_security: number;
              notif_updates: number;
            }>();

          if (!row) {
            return new Response(
              JSON.stringify({
                ok: true,
                settings: { email: true, security: true, updates: false },
              }),
              { headers: { "Content-Type": "application/json" } },
            );
          }

          return new Response(
            JSON.stringify({
              ok: true,
              settings: {
                email: row.notif_email === 1,
                security: row.notif_security === 1,
                updates: row.notif_updates === 1,
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      PUT: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const session = await verifySession(token);
          if (!session.ok || !session.user?.id) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as {
            email?: boolean;
            security?: boolean;
            updates?: boolean;
          };

          const db = requireDb();
          const now = Math.floor(Date.now() / 1000);
          const userId = session.user.id;

          const existing = await db
            .prepare("SELECT id FROM user_settings WHERE user_id = ?")
            .bind(userId)
            .first<{ id: string }>();

          if (existing) {
            await db
              .prepare(
                "UPDATE user_settings SET notif_email = ?, notif_security = ?, notif_updates = ?, updated_at = ? WHERE user_id = ?",
              )
              .bind(body.email ? 1 : 0, body.security ? 1 : 0, body.updates ? 1 : 0, now, userId)
              .run();
          } else {
            await db
              .prepare(
                "INSERT INTO user_settings (id, user_id, notif_email, notif_security, notif_updates, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
              )
              .bind(
                crypto.randomUUID(),
                userId,
                body.email ? 1 : 0,
                body.security ? 1 : 0,
                body.updates ? 1 : 0,
                now,
                now,
              )
              .run();
          }

          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
