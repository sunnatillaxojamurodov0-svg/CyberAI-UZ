import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { checkAiQuota, trackTokenUsage } from "@/lib/auth/ai-quota";
import {
  writeAnalytics,
  trackAiUsage,
  trackModelSwitch,
  trackInjectionAttempt,
} from "@/lib/analytics";
import { checkPromptInjection, sanitizeInput, createSecureSystemPrompt } from "@/lib/prompt-guard";
import { createOptimizedMessages } from "@/lib/context-optimizer";
import { fetchWithFallback } from "@/lib/fallback-models";
import { getCachedResponse, setCachedResponse } from "@/lib/prompt-cache";

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

          const injectionCheck = checkPromptInjection(body.message);
          if (!injectionCheck.safe) {
            trackInjectionAttempt(userId, injectionCheck.score, injectionCheck.threats);
            return new Response(
              "Your message contains potentially harmful content and has been blocked.",
              {
                status: 403,
                headers: { "Content-Type": "text/plain" },
              },
            );
          }

          const sanitizedMessage = sanitizeInput(body.message);

          const history = (body.history ?? []).slice(-100);

          const now = new Date();
          const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
          try {
            const q = (env as Record<string, unknown>).AI_USAGE_QUEUE as {
              send: (msg: unknown) => Promise<void>;
            };
            await q.send({ userId: userId ?? "__anonymous__", date: dateStr });
          } catch (err) {
            console.error("Queue send failed (non-fatal):", err);
          }

          const modelName = body.model || "nvidia/nemotron-3-ultra-550b-a55b:free";
          const secureSystemPrompt = body.systemPrompt
            ? createSecureSystemPrompt(body.systemPrompt)
            : undefined;

          const messages = createOptimizedMessages(
            secureSystemPrompt,
            history.map((h) => ({
              role: h.role === "assistant" ? "assistant" : "user",
              content: sanitizeInput(h.content),
            })),
            sanitizedMessage,
          );

          const cachedResponse = await getCachedResponse(messages, modelName);
          if (cachedResponse) {
            trackAiUsage(
              userId,
              modelName,
              modelName,
              0,
              { prompt: 0, completion: 0, total: 0 },
              true,
              false,
            );
            return new Response(cachedResponse.response, {
              headers: { "Content-Type": "text/plain", "X-Cache": "HIT" },
            });
          }

          const fallbackResult = await fetchWithFallback(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://cyberaiuz.workers.dev",
                "X-OpenRouter-Title": "CyberAI",
              },
              body: JSON.stringify({
                model: modelName,
                messages,
                stream: true,
              }),
            },
            modelName,
            { maxRetries: 3, retryDelay: 1000, enableFallback: true },
          );

          if (!fallbackResult.success || !fallbackResult.response) {
            console.error("All models failed:", fallbackResult.error);
            writeAnalytics("chat", "error", userId, "/api/chat", Date.now() - startTime, {
              model: modelName,
              error: fallbackResult.error,
              attempts: fallbackResult.attempts,
              fallbackModel: fallbackResult.model,
            });
            return new Response("AI service error. All models unavailable. Please try again.", {
              status: 502,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const orResponse = fallbackResult.response;
          const usedModel = fallbackResult.model;
          if (usedModel !== modelName) {
            trackModelSwitch(userId, modelName, usedModel, "primary model unavailable");
          }

          const stream = new ReadableStream({
            async start(controller) {
              try {
                const reader = orResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let totalContent = "";

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
                          totalContent += content;
                        }
                        if (parsed.usage) {
                          trackTokenUsage(userId, modelName, {
                            promptTokens: parsed.usage.prompt_tokens || 0,
                            completionTokens: parsed.usage.completion_tokens || 0,
                            totalTokens: parsed.usage.total_tokens || 0,
                          }).catch((err) => {
                            console.error("Failed to track token usage:", err);
                          });
                        }
                      } catch (err) {
                        console.error("Malformed SSE chunk:", err);
                      }
                    }
                  }
                }

                if (totalContent && !orResponse!.headers.get("x-openrouter-processing")) {
                  const estimatedPromptTokens = Math.ceil(
                    messages.reduce((acc, m) => acc + m.content.length / 4, 0),
                  );
                  const estimatedCompletionTokens = Math.ceil(totalContent.length / 4);
                  trackTokenUsage(userId, modelName, {
                    promptTokens: estimatedPromptTokens,
                    completionTokens: estimatedCompletionTokens,
                    totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
                  }).catch((err) => {
                    console.error("Failed to track token usage:", err);
                  });
                }
              } catch (err) {
                console.error("Stream error:", err);
                controller.enqueue(
                  new TextEncoder().encode(
                    `[AI response interrupted: ${err instanceof Error ? err.message : String(err)}]`,
                  ),
                );
              } finally {
                if (totalContent) {
                  setCachedResponse(messages, totalContent, usedModel).catch((err) => {
                    console.error("Failed to cache AI response:", err);
                  });
                }
                controller.close();
              }
            },
          });

          trackAiUsage(
            userId,
            usedModel,
            modelName,
            Date.now() - startTime,
            { prompt: 0, completion: 0, total: 0 },
            true,
            usedModel !== modelName,
          );
          return new Response(stream, {
            headers: { "Content-Type": "text/plain", "X-Cache": "MISS" },
          });
        } catch (err) {
          console.error("Chat API error:", err);
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
