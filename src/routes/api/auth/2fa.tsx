import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { setup2FA, enable2FA, disable2FA, is2FAEnabled } from "@/lib/auth/auth-server";
import {
  setup2FA as setupTOTP,
  enable2FA as enableTOTP,
  disable2FA as disableTOTP,
  verify2FA as verifyTOTP,
  is2FAEnabled as check2FA,
} from "@/lib/auth/totp";
import {
  jsonOk,
  jsonError,
  jsonResponse,
  serverError,
  unauthorizedError,
} from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

export const Route = createFileRoute("/api/auth/2fa")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const enabled = await check2FA(auth.user.id);
          return jsonOk({ enabled });
        } catch (err) {
          return serverError("Internal server error");
        }
      },

      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const body = (await request.json()) as { action?: string; token?: string };
          const userId = auth.user.id;

          if (body.action === "setup") {
            const result = await setupTOTP(userId);
            return jsonOk({ secret: result.secret, qrCodeUrl: result.qrCodeUrl });
          }

          if (body.action === "enable" && body.token) {
            const result = await enableTOTP(userId, body.token);
            return jsonResponse(result, result.ok ? 200 : 400);
          }

          if (body.action === "disable" && body.token) {
            const result = await disableTOTP(userId, body.token);
            return jsonResponse(result, result.ok ? 200 : 400);
          }

          return jsonError("Invalid action");
        } catch (err) {
          return serverError("Internal server error");
        }
      },
    },
  },
});
