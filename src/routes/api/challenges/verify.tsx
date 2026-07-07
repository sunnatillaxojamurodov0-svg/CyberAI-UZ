import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { withAuth } from "@/lib/auth/middleware";
import { verifyFlag } from "@/lib/dynamic-flags";

export const Route = createFileRoute("/api/challenges/verify")({
  server: {
    handlers: {
      POST: withAuth(async ({ request, user }) => {
        try {
          const body = (await request.json()) as { challengeId?: string; flag?: string };
          if (!body.challengeId || !body.flag) {
            return new Response(JSON.stringify({ error: "challengeId and flag are required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await verifyFlag(body.challengeId, session.user.id, body.flag);
          return new Response(JSON.stringify(result), {
            status: result.valid ? 200 : 400,
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
