import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/db";
import { jsonOk, jsonError, serverError, serviceUnavailableText } from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

type WorkflowBinding = {
  create: (opts: { id: string; params: Record<string, unknown> }) => Promise<{ id: string }>;
  get: (
    id: string,
  ) => Promise<{ status: () => Promise<{ status: string; output?: unknown; error?: string }> }>;
};

export const Route = createFileRoute("/api/workflows")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const body = (await request.json()) as {
            action: "challenge" | "console";
            difficulty?: number;
            category?: string;
            sessionId?: string;
            challengeId?: string;
            commandHistory?: string[];
          };

          const userId = auth.user.id;
          const envRecord = env as Record<string, unknown>;

          if (body.action === "challenge") {
            const workflow = envRecord.CHALLENGE_WORKFLOW as WorkflowBinding | undefined;
            if (!workflow) {
              return jsonError("Workflow not configured", 503);
            }

            const instance = await workflow.create({
              id: `challenge-${Date.now()}`,
              params: {
                userId,
                difficulty: body.difficulty ?? 1,
                category: body.category ?? "web",
              },
            });
            return jsonOk({ instanceId: instance.id });
          }

          if (body.action === "console") {
            if (!body.sessionId || !body.challengeId) {
              return jsonError("sessionId and challengeId required");
            }

            const workflow = envRecord.CONSOLE_WORKFLOW as WorkflowBinding | undefined;
            if (!workflow) {
              return jsonError("Workflow not configured", 503);
            }

            const instance = await workflow.create({
              id: `console-${body.sessionId}`,
              params: {
                sessionId: body.sessionId,
                userId,
                challengeId: body.challengeId,
                commandHistory: body.commandHistory ?? [],
              },
            });
            return jsonOk({ instanceId: instance.id });
          }

          return jsonError("Invalid action");
        } catch (err) {
          console.error("Workflow API error:", err);
          return serverError();
        }
      },

      GET: async ({ request }) => {
        try {
          const env = getEnv();
          const url = new URL(request.url);
          const instanceId = url.searchParams.get("instanceId");
          const workflowName = url.searchParams.get("workflow");

          if (!instanceId || !workflowName) {
            return jsonError("instanceId and workflow required");
          }

          const workflowMap: Record<string, string> = {
            challenge: "CHALLENGE_WORKFLOW",
            console: "CONSOLE_WORKFLOW",
            onboarding: "ONBOARDING_WORKFLOW",
          };

          const binding = workflowMap[workflowName];
          if (!binding) {
            return jsonError("Invalid workflow name");
          }

          const envRecord = env as Record<string, unknown>;
          const workflow = envRecord[binding] as WorkflowBinding | undefined;
          if (!workflow) {
            return jsonError("Workflow not configured", 503);
          }

          const instance = await workflow.get(instanceId);
          const status = await instance.status();

          return jsonOk({ status });
        } catch (err) {
          console.error("Workflow status error:", err);
          return serverError();
        }
      },
    },
  },
});
