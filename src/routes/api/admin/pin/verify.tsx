import { createFileRoute } from "@tanstack/react-router";
import { requireDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth-admin";

export const Route = createFileRoute("/api/admin/pin/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAdmin(request);
          if (!auth.ok) {
            return new Response(JSON.stringify({ ok: false, error: auth.error }), {
              status: auth.status,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as { pin?: string };
          if (!body.pin) {
            return new Response(JSON.stringify({ ok: false, error: "PIN is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = requireDb();
          const record = await db
            .prepare("SELECT pin_hash FROM admin_pins WHERE user_id = ?")
            .bind(auth.user.id)
            .first<{ pin_hash: string }>();

          // If no PIN is set, allow access (first-time setup)
          if (!record) {
            return new Response(
              JSON.stringify({
                ok: true,
                requiresSetup: true,
                message: "No admin PIN set. Please set one.",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          // Verify the PIN
          const encoder = new TextEncoder();
          const pinData = encoder.encode(body.pin);
          const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
          const pinHash = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          // Constant-time comparison
          if (pinHash.length !== record.pin_hash.length) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid PIN" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          let result = 0;
          for (let i = 0; i < pinHash.length; i++) {
            result |= pinHash.charCodeAt(i) ^ record.pin_hash.charCodeAt(i);
          }

          if (result !== 0) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid PIN" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ ok: true, message: "PIN verified" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Failed to verify PIN" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
