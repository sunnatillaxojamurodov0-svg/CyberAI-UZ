import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/auth/auth-server";
import { jsonOk, jsonError, jsonResponse, serverError } from "@/lib/api-response";
import { withRateLimit, isRateLimitResponse } from "@/lib/api-middleware";

export const Route = createFileRoute("/api/auth/reset-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const rl = await withRateLimit(request, "reset", "auth", "/api/auth/reset-password");
          if (isRateLimitResponse(rl)) return rl;

          const body = (await request.json()) as {
            email?: string;
            token?: string;
            newPassword?: string;
          };

          if (body.token && body.newPassword) {
            const { resetPassword } = await import("@/lib/auth/auth-server");
            const result = await resetPassword(body.token, body.newPassword);
            return jsonResponse(result, result.ok ? 200 : 400);
          }

          if (!body.email) {
            return jsonError("Email is required.");
          }

          const result = await createPasswordResetToken(body.email);
          if (result.ok && result.token) {
            sendPasswordResetEmail(body.email, result.token).catch(() => {});
          }

          return jsonOk({
            message: "If an account exists, a reset link has been sent.",
          });
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
