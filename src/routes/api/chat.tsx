import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { checkAiQuota, incrementAiUsage } from "@/lib/auth/ai-quota";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const apiKey = env.GEMINI_API_KEY as string;
          if (!apiKey) {
            return new Response("AI service is not configured.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const rl = await checkRateLimit(rateLimitKey(ip, "chat"), "chat");
          if (!rl.allowed) {
            return new Response("Too many requests. Try again later.", {
              status: 429,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;
          const userId = session?.ok ? session.user?.id ?? null : null;

          const quota = await checkAiQuota(userId);
          if (!quota.allowed) {
            return new Response("Daily AI quota exceeded. Try again tomorrow.", {
              status: 429,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const body = await request.json() as {
            history?: { role: "user" | "assistant"; content: string }[];
            message?: string;
            systemPrompt?: string;
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

          if (body.imageBase64 && body.imageBase64.length > 5_000_000) {
            return new Response("Image too large (max 5MB).", {
              status: 400,
              headers: { "Content-Type": "text/plain" },
            });
          }

          await incrementAiUsage(userId);

          const genAI = new GoogleGenerativeAI(apiKey);

          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: body.systemPrompt,
          });

          const mappedHistory = history.map((h) => ({
            role: h.role === "assistant" ? "model" : "user" as const,
            parts: [{ text: h.content }],
          }));

          const chat = model.startChat({ history: mappedHistory });

          const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: body.message }];

          if (body.imageBase64 && body.imageMimeType) {
            parts.push({ inlineData: { mimeType: body.imageMimeType, data: body.imageBase64 } });
          }

          const result = await chat.sendMessageStream(parts);

          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.stream) {
                  const text = chunk.text();
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                }
              } catch {
                controller.enqueue(new TextEncoder().encode("[AI response interrupted]"));
              } finally {
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: { "Content-Type": "text/plain" },
          });
        } catch {
          return new Response("AI service error.", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
    },
  },
});
