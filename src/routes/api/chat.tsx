import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { checkAiQuota } from "@/lib/auth/ai-quota";
import { writeAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const apiKey = env.OPENROUTER_API_KEY as string;
          if (!apiKey) {
            return new Response("AI service is not configured.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const startTime = Date.now();
          const rl = await checkRateLimit(rateLimitKey(ip, "chat"), "chat");
          if (!rl.allowed) {
            writeAnalytics("chat", "denied", null, "/api/chat", Date.now() - startTime);
            return new Response("Too many requests. Try again later.", {
              status: 429,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;
          const userId = session?.ok ? (session.user?.id ?? null) : null;

          const quota = await checkAiQuota(userId);
          if (!quota.allowed) {
            writeAnalytics("quota", "denied", userId, "/api/chat", Date.now() - startTime);
            return new Response("Daily AI quota exceeded. Try again tomorrow.", {
              status: 429,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const body = (await request.json()) as {
            history?: { role: "user" | "assistant"; content: string }[];
            message?: string;
            systemPrompt?: string;
            model?: string;
            imageBase64?: string;
            imageMimeType?: string;
          };

          if (!body.message) {
            return new Response("Message is required.", {
              status: 400,
              headers: { "Content-Type": "text/plain" },
            });
          }

          if (body.message.length > 10000) {
            return new Response("Message too long (max 10000 characters).", {
              status: 400,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const history = (body.history ?? []).slice(-50);

          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          try {
            const q = (env as Record<string, unknown>).AI_USAGE_QUEUE as { send: (msg: unknown) => Promise<void> };
            await q.send({ userId: userId ?? "__anonymous__", date: dateStr });
          } catch { /* non-fatal */ }

          const modelName = body.model || "nvidia/nemotron-3-ultra-550b-a55b:free";

          const messages = [
            ...(body.systemPrompt ? [{ role: "system", content: body.systemPrompt }] : []),
            ...history.map((h) => ({
              role: h.role === "assistant" ? "assistant" : "user",
              content: h.content,
            })),
            { role: "user", content: body.message },
          ];

          let orResponse: Response;
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries) {
            orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://cyberaiuz.workers.dev",
                "X-OpenRouter-Title": "CyberAI",
              },
              body: JSON.stringify({
                model: modelName,
                messages,
                stream: true,
              }),
            });

            if (orResponse.ok) break;

            if (orResponse.status === 429) {
              retries++;
              const retryAfter = orResponse.headers.get("Retry-After") || "3";
              const waitMs = parseInt(retryAfter) * 1000;
              await new Promise(resolve => setTimeout(resolve, waitMs));
              continue;
            }

            break;
          }

          if (!orResponse!.ok) {
            const errorText = await orResponse!.text();
            console.error("OpenRouter error:", errorText);
            writeAnalytics("chat", "error", userId, "/api/chat", Date.now() - startTime, { model: modelName, error: errorText });
            return new Response("AI service error. Please try again.", {
              status: 502,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const stream = new ReadableStream({
            async start(controller) {
              try {
                const reader = orResponse!.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    if (line.startsWith("data: ")) {
                      const data = line.slice(6);
                      if (data === "[DONE]") continue;
                      try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                          controller.enqueue(new TextEncoder().encode(content));
                        }
                      } catch {
                        // skip malformed chunks
                      }
                    }
                  }
                }
              } catch (err) {
                console.error("Stream error:", err);
                controller.enqueue(new TextEncoder().encode(`[AI response interrupted: ${err instanceof Error ? err.message : String(err)}]`));
              } finally {
                controller.close();
              }
            },
          });

          writeAnalytics("chat", "success", userId, "/api/chat", Date.now() - startTime, { model: modelName });
          return new Response(stream, {
            headers: { "Content-Type": "text/plain" },
          });
        } catch (err) {
          writeAnalytics("chat", "error", null, "/api/chat", Date.now() - startTime);
          return new Response("AI service error.", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
    },
  },
});
