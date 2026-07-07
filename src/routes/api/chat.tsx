import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { checkAiQuota, trackTokenUsage } from "@/lib/auth/ai-quota";
import { writeAnalytics, trackAiUsage, trackInjectionAttempt } from "@/lib/analytics";
import { checkPromptInjection, sanitizeInput, createSecureSystemPrompt } from "@/lib/prompt-guard";
import { createOptimizedMessages } from "@/lib/context-optimizer";
import { getCachedResponse, setCachedResponse } from "@/lib/prompt-cache";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: withAuth(async ({ request, user }) => {
        const startTime = Date.now();
        try {
          const env = getEnv();
          const groqKey = (env as Record<string, unknown>).GROQ_API_KEY as string;
          if (!groqKey) {
            return new Response("AI service is not configured.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const rl = await checkRateLimit(rateLimitKey(ip, "chat"), "chat");
          if (!rl.allowed) {
            writeAnalytics("chat", "denied", null, "/api/chat", Date.now() - startTime);
            return new Response("Too many requests. Try again later.", {
              status: 429,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const userId = user.id;

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

          const envRecord = env as Record<string, unknown>;
          const ai = envRecord.AI as
            | {
                run: (
                  model: string,
                  opts: { messages: Array<{ role: string; content: string }> },
                ) => Promise<{ response: string }>;
              }
            | undefined;
          const injectionCheck = await checkPromptInjection(body.message, ai);
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
          } catch {
            /* non-fatal */
          }

          const selectedModel = body.model || "groq-gpt";
          const groqModel =
            selectedModel === "groq-llama" ? "llama-3.3-70b-versatile" : "openai/gpt-oss-120b";

          // Do not allow user-supplied system prompts for security
          const secureSystemPrompt = undefined;

          const historyMessages = history.map((h) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: sanitizeInput(h.content),
          }));

          let userContent:
            string | Array<{ type: string; text?: string; image_url?: { url: string } }> =
            sanitizedMessage;

          if (body.imageBase64 && body.imageMimeType) {
            const dataUrl = `data:${body.imageMimeType};base64,${body.imageBase64}`;
            userContent = [
              {
                type: "text",
                text: sanitizedMessage,
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ];
          }

          const messages = [
            ...(secureSystemPrompt ? [{ role: "system", content: secureSystemPrompt }] : []),
            ...historyMessages,
            { role: "user", content: userContent },
          ];

          // Use SHA-256 hash for cache key to prevent collisions
          const cacheInput = `${selectedModel}:${body.imageBase64 ? "img:" : ""}:${sanitizedMessage}:${JSON.stringify(historyMessages)}`;
          const cacheKeyHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(cacheInput),
          );
          const cacheKey = `groq:${Array.from(new Uint8Array(cacheKeyHash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")}`;
          const cachedResponse = await getCachedResponse(messages, cacheKey);
          if (cachedResponse && !body.imageBase64) {
            trackAiUsage(
              userId,
              selectedModel,
              selectedModel,
              0,
              { prompt: 0, completion: 0, total: 0 },
              true,
              false,
            );
            return new Response(cachedResponse.response, {
              headers: { "Content-Type": "text/plain", "X-Cache": "HIT" },
            });
          }

          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: groqModel,
              messages,
              stream: true,
              max_tokens: 4096,
            }),
          });

          if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            console.error("Groq API error:", groqResponse.status, errText);
            writeAnalytics("chat", "error", userId, "/api/chat", Date.now() - startTime, {
              model: selectedModel,
              error: errText,
              status: groqResponse.status,
            });
            return new Response("AI service error. Please try again.", {
              status: 502,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const stream = new ReadableStream({
            async start(controller) {
              try {
                const reader = groqResponse.body!.getReader();
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
                      } catch {
                        // skip malformed chunks
                      }
                    }
                  }
                }

                const estimatedPromptTokens = Math.ceil(
                  messages.reduce((acc, m) => {
                    const content =
                      typeof m.content === "string" ? m.content : JSON.stringify(m.content);
                    return acc + content.length / 4;
                  }, 0),
                );
                const estimatedCompletionTokens = Math.ceil(totalContent.length / 4);
                trackTokenUsage(userId, selectedModel, {
                  promptTokens: estimatedPromptTokens,
                  completionTokens: estimatedCompletionTokens,
                  totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
                }).catch(() => {});

                if (totalContent && !body.imageBase64) {
                  setCachedResponse(messages, totalContent, cacheKey).catch(() => {});
                }
              } catch (err) {
                console.error("Groq stream error:", err);
                controller.enqueue(
                  new TextEncoder().encode(
                    `[AI response interrupted: ${err instanceof Error ? err.message : String(err)}]`,
                  ),
                );
              } finally {
                controller.close();
              }
            },
          });

          trackAiUsage(
            userId,
            selectedModel,
            selectedModel,
            Date.now() - startTime,
            { prompt: 0, completion: 0, total: 0 },
            true,
            false,
          );
          return new Response(stream, {
            headers: { "Content-Type": "text/plain", "X-Cache": "MISS" },
          });
        } catch (err) {
          writeAnalytics("chat", "error", null, "/api/chat", Date.now() - startTime);
          return new Response("AI service error.", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      }),
    },
  },
});
