import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { trackTokenUsage } from "@/lib/auth/ai-quota";
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
import { textError, textResponse, serviceUnavailableText } from "@/lib/api-response";
import { checkAiAccess, isResponse, trackAiQueue } from "@/lib/api-middleware";
import { createSSEStream } from "@/lib/api-stream";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const access = await checkAiAccess(request, "chat", "/api/chat", "chat");
          if (isResponse(access)) return access;

          const { apiKey, userId, startTime } = access;

          const body = (await request.json()) as {
            history?: { role: "user" | "assistant"; content: string }[];
            message?: string;
            systemPrompt?: string;
            model?: string;
            imageBase64?: string;
            imageMimeType?: string;
          };

          if (!body.message) {
            return textError("Message is required.");
          }

          if (body.message.length > 10000) {
            return textError("Message too long (max 10000 characters).");
          }

          const injectionCheck = checkPromptInjection(body.message);
          if (!injectionCheck.safe) {
            trackInjectionAttempt(userId, injectionCheck.score, injectionCheck.threats);
            return textError(
              "Your message contains potentially harmful content and has been blocked.",
              403,
            );
          }

          const sanitizedMessage = sanitizeInput(body.message);
          const history = (body.history ?? []).slice(-100);

          trackAiQueue(userId);

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
            return textResponse(cachedResponse.response, 200, { "X-Cache": "HIT" });
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
            return textError("AI service error. All models unavailable. Please try again.", 502);
          }

          const orResponse = fallbackResult.response;
          const usedModel = fallbackResult.model;
          if (usedModel !== modelName) {
            trackModelSwitch(userId, modelName, usedModel, "primary model unavailable");
          }

          const stream = createSSEStream(orResponse, {
            onUsage: (usage) => {
              trackTokenUsage(userId, modelName, {
                promptTokens: usage.prompt_tokens || 0,
                completionTokens: usage.completion_tokens || 0,
                totalTokens: usage.total_tokens || 0,
              }).catch(() => {});
            },
            onDone: (totalContent) => {
              if (totalContent && !orResponse.headers.get("x-openrouter-processing")) {
                const estimatedPromptTokens = Math.ceil(
                  messages.reduce((acc, m) => acc + m.content.length / 4, 0),
                );
                const estimatedCompletionTokens = Math.ceil(totalContent.length / 4);
                trackTokenUsage(userId, modelName, {
                  promptTokens: estimatedPromptTokens,
                  completionTokens: estimatedCompletionTokens,
                  totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
                }).catch(() => {});
              }
              if (totalContent) {
                setCachedResponse(messages, totalContent, usedModel).catch(() => {});
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
          writeAnalytics("chat", "error", null, "/api/chat", 0);
          return textError("AI service error.", 500);
        }
      },
    },
  },
});
