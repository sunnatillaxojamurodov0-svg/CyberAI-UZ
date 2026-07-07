import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { withAuth } from "@/lib/auth/middleware";
import {
  setup2FA,
  enable2FA,
  disable2FA,
  is2FAEnabled,
} from "@/lib/auth/auth-server";
import {
  setup2FA as setupTOTP,
  enable2FA as enableTOTP,
  disable2FA as disableTOTP,
  verify2FA as verifyTOTP,
  is2FAEnabled as check2FA,
} from "@/lib/auth/totp";

export const Route = createFileRoute("/api/auth/2fa")({
  server: {
    handlers: {
      GET: withAuth(async ({ request, user }) => {
        try {
          const enabled = await check2FA(user.id);
          return new Response(JSON.stringify({ ok: true, enabled }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }),

      POST: withAuth(async ({ request, user }) => {
        try {
          const body = (await request.json()) as { action?: string; token?: string };
          const userId = user.id;

          if (body.action === "setup") {
            const result = await setupTOTP(userId);
            return new Response(
              JSON.stringify({ ok: true, secret: result.secret, qrCodeUrl: result.qrCodeUrl }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          if (body.action === "enable" && body.token) {
            const result = await enableTOTP(userId, body.token);
            return new Response(JSON.stringify(result), {
              status: result.ok ? 200 : 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (body.action === "disable" && body.token) {
            const result = await disableTOTP(userId, body.token);
            return new Response(JSON.stringify(result), {
              status: result.ok ? 200 : 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }),
    },
  },
});
