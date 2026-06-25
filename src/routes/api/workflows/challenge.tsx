import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { jsonResponse, textError, catchError } from "@/lib/api-response";

export const Route = createFileRoute("/api/workflows/challenge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const workflow = env.CHALLENGE_GENERATOR as
            | { create: (opts: { id?: string; params: unknown }) => Promise<{ id: string }> }
            | undefined;
          if (!workflow) {
            return textError("Challenge Generator workflow not available.", 503);
          }

          const body = (await request.json()) as {
            challengeName?: string;
            difficulty?: number;
            category?: string;
            scenario?: string;
            objectives?: string[];
          };

          if (!body.challengeName || !body.category || !body.scenario) {
            return textError("challengeName, category, and scenario are required.");
          }

          const instance = await workflow.create({
            id: crypto.randomUUID(),
            params: {
              challengeName: body.challengeName,
              difficulty: body.difficulty ?? 1,
              category: body.category,
              scenario: body.scenario,
              objectives: body.objectives ?? [],
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
