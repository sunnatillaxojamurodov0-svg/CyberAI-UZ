import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { jsonResponse, textError, catchError } from "@/lib/api-response";

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
            return textError("User Onboarding workflow not available.", 503);
          }

          const body = (await request.json()) as {
            userId?: string;
            email?: string;
            name?: string;
          };

          if (!body.userId || !body.email) {
            return textError("userId and email are required.");
          }

          const instance = await workflow.create({
            id: `onboard-${body.userId}`,
            params: {
              userId: body.userId,
              email: body.email,
              name: body.name ?? "User",
            },
          });

          return jsonResponse({ ok: true, instanceId: instance.id }, 202);
        } catch (err) {
          return catchError(err, "Workflow failed");
        }
      },
    },
  },
});
