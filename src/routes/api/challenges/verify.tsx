import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { verifyFlag } from "@/lib/dynamic-flags";
import { jsonResponse, serverError } from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

export const Route = createFileRoute("/api/challenges/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const body = (await request.json()) as { challengeId?: string; flag?: string };
          if (!body.challengeId || !body.flag) {
            return jsonResponse({ error: "challengeId and flag are required" }, 400);
          }

          const result = await verifyFlag(body.challengeId, auth.user.id, body.flag);
          return jsonResponse(result, result.valid ? 200 : 400);
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
