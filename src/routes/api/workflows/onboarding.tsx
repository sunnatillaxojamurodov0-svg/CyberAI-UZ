import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";

export const Route = createFileRoute("/api/workflows/onboarding")({
  server: {
    handlers: {
      POST: withAuth(async ({ request, user }) => {
        try {
          const env = getEnv();
          const workflow = env.USER_ONBOARDING as
            | { create: (opts: { id?: string; params: unknown }) => Promise<{ id: string }> }
            | undefined;
          if (!workflow) {
            return new Response("User Onboarding workflow not available.", { status: 503 });
          }

          const body = (await request.json()) as {
            email?: string;
            name?: string;
          };

          if (!body.email) {
            return new Response("email is required.", { status: 400 });
          }

          const userId = user.id;

          const instance = await workflow.create({
            id: `onboard-${userId}`,
            params: {
              userId,
              email: body.email,
              name: body.name ?? auth.user.name ?? "User",
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
