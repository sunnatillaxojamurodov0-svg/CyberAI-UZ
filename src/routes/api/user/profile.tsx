import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";

export const Route = createFileRoute("/api/user/profile")({
  server: {
    handlers: {
      GET: withAuth(async ({ request, user }) => {
        try {
          const db = requireDb();
          const row = await db
            .prepare(
              "SELECT id, email, name, avatar_url, bio, created_at, updated_at FROM users WHERE id = ?",
            )
            .bind(user.id)
            .first();

          if (!row) {
            return new Response(JSON.stringify({ ok: false, error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({
              ok: true,
              user: {
                id: row.id,
                email: row.email,
                name: row.name,
                avatar_url: row.avatar_url ? `/api/user/avatar?user=${row.id}` : null,
                bio: row.bio,
                created_at: row.created_at,
                updated_at: row.updated_at,
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          console.error("Profile error:", err);
          return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }),

      PUT: withAuth(async ({ request, user }) => {
        try {
          const body = (await request.json()) as { name?: string; bio?: string };
          const now = Math.floor(Date.now() / 1000);
          const userId = user.id;

          const name = body.name !== undefined ? body.name.trim().slice(0, 100) : undefined;
          const bio = body.bio !== undefined ? body.bio.trim().slice(0, 500) : undefined;

          if (name !== undefined && !name) {
            return new Response(JSON.stringify({ ok: false, error: "Name cannot be empty" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = requireDb();

          if (name !== undefined && bio !== undefined) {
            await db
              .prepare("UPDATE users SET name = ?, bio = ?, updated_at = ? WHERE id = ?")
              .bind(name, bio || null, now, userId)
              .run();
          } else if (name !== undefined) {
            await db
              .prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?")
              .bind(name, now, userId)
              .run();
          } else if (bio !== undefined) {
            await db
              .prepare("UPDATE users SET bio = ?, updated_at = ? WHERE id = ?")
              .bind(bio || null, now, userId)
              .run();
          }

          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Profile error:", err);
          return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }),
    },
  },
});
