import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { verifyFlag } from "@/lib/dynamic-flags";

export const Route = createFileRoute("/api/challenges/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const session = await verifySession(token);
          if (!session.ok || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const body = (await request.json()) as { challengeId?: string; flag?: string };
          if (!body.challengeId || !body.flag) {
            return new Response(JSON.stringify({ error: "challengeId and flag are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const result = await verifyFlag(body.challengeId, session.user.id, body.flag);
          return new Response(JSON.stringify(result), {
            status: result.valid ? 200 : 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
