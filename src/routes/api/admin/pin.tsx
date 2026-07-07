import { createFileRoute } from "@tanstack/react-router";
import { requireDb } from "@/lib/db";
import { withAdmin } from "@/lib/auth/middleware";

export const Route = createFileRoute("/api/admin/pin")({
  server: {
    handlers: {
      // POST: Set or update admin PIN
      POST: withAdmin(async ({ request, user }) => {
        try {

          const body = (await request.json()) as { pin?: string };
          if (!body.pin || body.pin.length < 6 || body.pin.length > 32) {
            return new Response(
              JSON.stringify({ ok: false, error: "PIN must be 6-32 characters" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // Validate PIN has at least one letter, one number, and one special character
          const hasLetter = /[a-zA-Z]/.test(body.pin);
          const hasNumber = /[0-9]/.test(body.pin);
          const hasSpecial = /[^a-zA-Z0-9_-]/.test(body.pin);
          if (!hasLetter || !hasNumber || !hasSpecial) {
            return new Response(
              JSON.stringify({
                ok: false,
                error:
                  "PIN must contain at least one letter, one number, and one special character (!@#$%^&*)",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const db = requireDb();

          // Hash the PIN using SHA-256
          const encoder = new TextEncoder();
          const pinData = encoder.encode(body.pin);
          const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
          const pinHash = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          // Upsert the PIN
          await db
            .prepare(
              `INSERT INTO admin_pins (user_id, pin_hash, created_at, updated_at)
               VALUES (?, ?, unixepoch(), unixepoch())
               ON CONFLICT(user_id) DO UPDATE SET
                 pin_hash = excluded.pin_hash,
                 updated_at = excluded.updated_at`,
            )
            .bind(user.id, pinHash)
            .run();

          return new Response(JSON.stringify({ ok: true, message: "Admin PIN set successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Failed to set admin PIN" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }),

      // DELETE: Remove admin PIN
      DELETE: withAdmin(async ({ request, user }) => {
        try {
          const db = requireDb();
          await db.prepare("DELETE FROM admin_pins WHERE user_id = ?").bind(user.id).run();

          return new Response(JSON.stringify({ ok: true, message: "Admin PIN removed" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Failed to remove admin PIN" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }),
    },
  },
});
