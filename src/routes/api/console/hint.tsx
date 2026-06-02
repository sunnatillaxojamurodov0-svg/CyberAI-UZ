import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { checkAiQuota, incrementAiUsage } from "@/lib/auth/ai-quota";

const SYSTEM_PROMPT = `You are CyberAI Mentor, an elite cybersecurity instructor in a CTF simulation environment. The user is stuck on a simulated CTF challenge. Your goal is to guide them WITHOUT ever giving away the actual flag, exploit payload, or exact solution. Analyze their command history and current challenge context. Provide cryptic but highly educational hints, suggest tool flags and techniques, and point out their mistakes. Keep the tone sharp, professional, and cyberpunk-esque. Be concise — no more than 4-5 sentences per response. Never reveal the flag. Never provide a complete exploit script. Encourage independent thinking.`;

export const Route = createFileRoute("/api/console/hint")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const apiKey = env.GEMINI_API_KEY as string;
          if (!apiKey) {
            return new Response("AI Mentor is not available.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const rl = await checkRateLimit(rateLimitKey(ip, "console-hint"), "chat");
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
            challengeId: string;
            challengeTitle: string;
            challengeLevel: number;
            challengeCategory: string;
            scenario: string;
            objectives: string[];
            targetIp: string;
            commandHistory: string[];
            userMessage: string;
            toolsUsed: string[];
          };

          if (!body.userMessage || body.userMessage.length > 2000) {
            return new Response("Message too long or empty.", {
              status: 400,
              headers: { "Content-Type": "text/plain" },
            });
          }

          await incrementAiUsage(userId);

          const context = [
            `Challenge: ${body.challengeTitle} (Level ${body.challengeLevel}, ${body.challengeCategory})`,
            `Target: ${body.targetIp}`,
            `Scenario: ${body.scenario}`,
            `Objectives: ${body.objectives.join(", ")}`,
            `Command history (last 15): ${(body.commandHistory ?? []).slice(-15).join("; ") || "none"}`,
            `Tools used: ${(body.toolsUsed ?? []).join(", ") || "none"}`,
            `User question: ${body.userMessage}`,
          ].join("\n");

          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_PROMPT,
          });

          const chat = model.startChat({
            history: [
              {
                role: "user",
                parts: [{ text: "Here is my current challenge context and question:" }],
              },
              {
                role: "model",
                parts: [{ text: "Understood. Send me the context and I'll guide you." }],
              },
            ],
          });

          const result = await chat.sendMessageStream(context);

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
                controller.enqueue(new TextEncoder().encode("\n\n[AI Mentor connection interrupted. Try again.]"));
              } finally {
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: { "Content-Type": "text/plain" },
          });
        } catch {
          return new Response("AI Mentor error.", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
    },
  },
});
