import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";

export const Route = createFileRoute("/api/workflows/analysis")({
  server: {
    handlers: {
      POST: withAuth(async ({ request, user }) => {
        try {
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
            id: `analysis-${user.id}`,
            params: {
              userId: user.id,
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
      }),
    },
  },
});
