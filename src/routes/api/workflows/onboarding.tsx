import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";

export const Route = createFileRoute("/api/workflows/onboarding")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const workflow = env.USER_ONBOARDING as
            | { create: (opts: { id?: string; params: unknown }) => Promise<{ id: string }> }
            | undefined;
          if (!workflow) {
            return new Response("User Onboarding workflow not available.", { status: 503 });
          }

          const body = (await request.json()) as {
            userId?: string;
            email?: string;
            name?: string;
          };

          if (!body.userId || !body.email) {
            return new Response("userId and email are required.", { status: 400 });
          }

          const instance = await workflow.create({
            id: `onboard-${body.userId}`,
            params: {
              userId: body.userId,
              email: body.email,
              name: body.name ?? "User",
            },
          });

          return new Response(JSON.stringify({ ok: true, instanceId: instance.id }), {
            status: 202,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : "Workflow failed",
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
