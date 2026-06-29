import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

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
          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as {
            action: "challenge" | "console";
            difficulty?: number;
            category?: string;
            sessionId?: string;
            challengeId?: string;
            commandHistory?: string[];
          };

          const userId = session.user.id;
          const envRecord = env as Record<string, unknown>;

          if (body.action === "challenge") {
            const workflow = envRecord.CHALLENGE_WORKFLOW as WorkflowBinding | undefined;
            if (!workflow) {
              return new Response(JSON.stringify({ error: "Workflow not configured" }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              });
            }

            const instance = await workflow.create({
              id: `challenge-${Date.now()}`,
              params: {
                userId,
                difficulty: body.difficulty ?? 1,
                category: body.category ?? "web",
              },
            });
            return new Response(JSON.stringify({ ok: true, instanceId: instance.id }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          if (body.action === "console") {
            if (!body.sessionId || !body.challengeId) {
              return new Response(JSON.stringify({ error: "sessionId and challengeId required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }

            const workflow = envRecord.CONSOLE_WORKFLOW as WorkflowBinding | undefined;
            if (!workflow) {
              return new Response(JSON.stringify({ error: "Workflow not configured" }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              });
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
            return new Response(JSON.stringify({ ok: true, instanceId: instance.id }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Workflow API error:", err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      GET: async ({ request }) => {
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
          const url = new URL(request.url);
          const instanceId = url.searchParams.get("instanceId");
          const workflowName = url.searchParams.get("workflow");

          if (!instanceId || !workflowName) {
            return new Response(JSON.stringify({ error: "instanceId and workflow required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const workflowMap: Record<string, string> = {
            challenge: "CHALLENGE_WORKFLOW",
            console: "CONSOLE_WORKFLOW",
            onboarding: "ONBOARDING_WORKFLOW",
          };

          const binding = workflowMap[workflowName];
          if (!binding) {
            return new Response(JSON.stringify({ error: "Invalid workflow name" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const envRecord = env as Record<string, unknown>;
          const workflow = envRecord[binding] as WorkflowBinding | undefined;
          if (!workflow) {
            return new Response(JSON.stringify({ error: "Workflow not configured" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          }

          const instance = await workflow.get(instanceId);
          const status = await instance.status();

          return new Response(JSON.stringify({ ok: true, status }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Workflow status error:", err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
