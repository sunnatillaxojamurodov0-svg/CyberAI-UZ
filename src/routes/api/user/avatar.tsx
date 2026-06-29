import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb, getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/user/avatar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const userId = url.searchParams.get("user");
          if (!userId) {
            return new Response("Missing user id", { status: 400 });
          }

          const db = requireDb();
          const row = await db
            .prepare("SELECT avatar_url FROM users WHERE id = ?")
            .bind(userId)
            .first<{ avatar_url: string | null }>();

          if (!row?.avatar_url) {
            return new Response("No avatar", { status: 404 });
          }

          if (row.avatar_url.startsWith("http")) {
            return Response.redirect(row.avatar_url, 302);
          }

          const env = getEnv();
          const bucket = (env as Record<string, unknown>).MY_BUCKET as R2Bucket | undefined;
          if (!bucket) {
            return new Response("Storage unavailable", { status: 500 });
          }

          const object = await bucket.get(row.avatar_url);
          if (!object) {
            return new Response("Not found", { status: 404 });
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          headers.set("Cache-Control", "public, max-age=31536000, immutable");

          return new Response(object.body, { headers });
        } catch {
          return new Response("Error", { status: 500 });
        }
      },

      POST: async ({ request }) => {
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

          const contentType = request.headers.get("content-type") || "";
          if (!contentType.includes("multipart/form-data")) {
            return new Response(JSON.stringify({ ok: false, error: "Expected multipart form" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const formData = await request.formData();
          const file = formData.get("avatar") as File | null;
          if (!file) {
            return new Response(JSON.stringify({ ok: false, error: "No file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            return new Response(
              JSON.stringify({ ok: false, error: "Faqat JPG, PNG, WebP ruxsat etiladi" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const maxSize = 2 * 1024 * 1024;
          if (file.size > maxSize) {
            return new Response(
              JSON.stringify({ ok: false, error: "Rasm 2MB dan kichik bo'lishi kerak" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const env = getEnv();
          const bucket = (env as Record<string, unknown>).MY_BUCKET as R2Bucket | undefined;
          if (!bucket) {
            return new Response(JSON.stringify({ ok: false, error: "Storage unavailable" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const ext = file.type.split("/")[1] || "jpg";
          const key = `avatars/${session.user.id}.${ext}`;

          await bucket.put(key, file.stream(), {
            httpMetadata: { contentType: file.type },
          });

          const db = requireDb();
          await db
            .prepare("UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?")
            .bind(key, Math.floor(Date.now() / 1000), session.user.id)
            .run();

          return new Response(
            JSON.stringify({ ok: true, url: `/api/user/avatar?user=${session.user.id}` }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Upload failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      DELETE: async ({ request }) => {
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
            .prepare("SELECT avatar_url FROM users WHERE id = ?")
            .bind(session.user.id)
            .first<{ avatar_url: string | null }>();

          if (row?.avatar_url && !row.avatar_url.startsWith("http")) {
            const env = getEnv();
            const bucket = (env as Record<string, unknown>).MY_BUCKET as R2Bucket | undefined;
            if (bucket) {
              await bucket.delete(row.avatar_url).catch(() => {});
            }
          }

          await db
            .prepare("UPDATE users SET avatar_url = NULL, updated_at = ? WHERE id = ?")
            .bind(Math.floor(Date.now() / 1000), session.user.id)
            .run();

          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Delete failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
