import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";

export const Route = createFileRoute("/api/workflows/challenge")({
  server: {
    handlers: {
      POST: withAuth(async ({ request, user }) => {
        try {
          const env = getEnv();
          const workflow = env.CHALLENGE_GENERATOR as
            | { create: (opts: { id?: string; params: unknown }) => Promise<{ id: string }> }
            | undefined;
          if (!workflow) {
            return new Response("Challenge Generator workflow not available.", { status: 503 });
          }

          const body = (await request.json()) as {
            challengeName?: string;
            difficulty?: number;
            category?: string;
            scenario?: string;
            objectives?: string[];
          };

          if (!body.challengeName || !body.category || !body.scenario) {
            return new Response("challengeName, category, and scenario are required.", {
              status: 400,
            });
          }

          const instance = await workflow.create({
            id: crypto.randomUUID(),
            params: {
              userId: user.id,
              challengeName: body.challengeName,
              difficulty: body.difficulty ?? 1,
              category: body.category,
              scenario: body.scenario,
              objectives: body.objectives ?? [],
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
