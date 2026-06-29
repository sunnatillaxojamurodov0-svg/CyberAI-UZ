import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/workflows/analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const session = await verifySession(token);
          if (!session.ok || !session.user) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid session" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const env = getEnv();
          const workflow = env.CONSOLE_ANALYSIS as
            | { create: (opts: { id?: string; params: unknown }) => Promise<{ id: string }> }
            | undefined;
          if (!workflow) {
            return new Response("Console Analysis workflow not available.", { status: 503 });
          }

          const body = (await request.json()) as {
            sessionId?: string;
            commandHistory?: string[];
            challengeId?: string;
          };

          if (!body.sessionId) {
            return new Response("sessionId is required.", { status: 400 });
          }

          const instance = await workflow.create({
            id: `analysis-${body.sessionId}`,
            params: {
              sessionId: body.sessionId,
              userId: session.user.id,
              commandHistory: body.commandHistory ?? [],
              challengeId: body.challengeId ?? "unknown",
            },
          });

          return new Response(JSON.stringify({ ok: true, instanceId: instance.id }), {
            status: 202,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Workflow failed",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
