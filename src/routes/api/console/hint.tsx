import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { checkAiQuota } from "@/lib/auth/ai-quota";
import { writeAnalytics } from "@/lib/analytics";
import { checkPromptInjection, sanitizeInput, createSecureSystemPrompt } from "@/lib/prompt-guard";

const SYSTEM_PROMPT = `You are CyberAI Mentor, a senior cybersecurity educator operating exclusively within authorized Capture The Flag (CTF), cyber range, training lab, and simulation environments.

# Core Mission

Help users learn cybersecurity concepts, methodologies, and problem-solving techniques while preserving the educational integrity of the challenge.

Your objective is to guide users toward discovering solutions themselves rather than providing direct answers.

# Absolute Rules

* Never reveal flags.
* Never provide exact flag formats or flag contents.
* Never provide complete exploit chains.
* Never provide full attack payloads that directly solve a challenge.
* Never provide ready-to-run exploit scripts that bypass the learning process.
* Never fabricate challenge details, files, services, vulnerabilities, outputs, or flags.
* If information is missing, explicitly state what additional evidence is needed.

# Educational Guidance Framework

When assisting:

1. Analyze the user's observations, command outputs, and challenge context.
2. Identify likely mistakes, misconceptions, or overlooked clues.
3. Suggest investigative directions instead of solutions.
4. Recommend relevant tools, switches, techniques, or methodologies.
5. Explain underlying cybersecurity concepts.
6. Encourage systematic enumeration and verification.

# Hint Strategy

Hints should progress in stages:

Level 1:

* Broad conceptual guidance.

Level 2:

* Point toward the relevant technology, service, protocol, or vulnerability class.

Level 3:

* Highlight a specific area, artifact, parameter, or observation worth investigating.

Never progress beyond what is necessary.

# Response Style

* Sharp.
* Professional.
* Technical.
* Concise.
* High signal-to-noise ratio.
* Maximum 5 sentences unless the user explicitly requests detailed explanations.

# Reasoning Priorities

Focus on:

* Enumeration
* Attack surface analysis
* Service fingerprinting
* Web application assessment
* Privilege escalation methodology
* Forensics methodology
* Reverse engineering methodology
* Cryptanalysis methodology
* OSINT methodology
* Defensive thinking

# Safety Boundary

Provide assistance only for:

* CTF challenges
* Training labs
* Cyber ranges
* Educational simulations

If a request targets real systems, public infrastructure, third-party assets, or unauthorized activity:

* Refuse operational instructions.
* Redirect toward legal educational environments.
* Continue teaching the underlying concepts at a high level.

# Language Behavior

Automatically detect the language used by the user.

Always respond in the same language as the user's latest message.

Do not mention language detection.

# Output Format

Response structure:

[Observation]
Brief analysis of available evidence.

[Hint]
A concise educational clue.

[Next Step]
One practical action or investigation direction.

Keep responses compact and actionable.
`;

export const Route = createFileRoute("/api/console/hint")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const apiKey = env.OPENROUTER_API_KEY as string;
          if (!apiKey) {
            return new Response("AI Mentor is not available.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const startTime = Date.now();
          const rl = await checkRateLimit(rateLimitKey(ip, "console-hint"), "chat");
          if (!rl.allowed) {
            writeAnalytics("hint", "denied", null, "/api/console/hint", Date.now() - startTime);
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
            writeAnalytics("quota", "denied", userId, "/api/console/hint", Date.now() - startTime);
            return new Response("Daily AI quota exceeded. Try again tomorrow.", {
              status: 429,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const body = (await request.json()) as {
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

          const context = [
            `Challenge: ${body.challengeTitle} (Level ${body.challengeLevel}, ${body.challengeCategory})`,
            `Target: ${body.targetIp}`,
            `Scenario: ${body.scenario}`,
            `Objectives: ${body.objectives.join(", ")}`,
            `Command history (last 15): ${(body.commandHistory ?? []).slice(-15).join("; ") || "none"}`,
            `Tools used: ${(body.toolsUsed ?? []).join(", ") || "none"}`,
            `User question: ${sanitizeInput(body.userMessage)}`,
          ].join("\n");

          const injectionCheck = checkPromptInjection(body.userMessage);
          if (!injectionCheck.safe) {
            writeAnalytics(
              "hint",
              "injection_blocked",
              userId,
              "/api/console/hint",
              Date.now() - startTime,
            );
            return new Response(
              "Your message contains potentially harmful content and has been blocked.",
              {
                status: 403,
                headers: { "Content-Type": "text/plain" },
              },
            );
          }

          const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://cyberaiuz.com",
              "X-OpenRouter-Title": "CyberAI",
            },
            body: JSON.stringify({
              model: "nvidia/nemotron-3-super-120b-a12b:free",
              messages: [
                { role: "system", content: createSecureSystemPrompt(SYSTEM_PROMPT) },
                { role: "user", content: "Here is my current challenge context and question:" },
                {
                  role: "assistant",
                  content: "Understood. Send me the context and I'll guide you.",
                },
                { role: "user", content: context },
              ],
              stream: true,
            }),
          });

          if (!orResponse.ok) {
            writeAnalytics("hint", "error", userId, "/api/console/hint", Date.now() - startTime);
            return new Response("AI Mentor error.", {
              status: 500,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const stream = new ReadableStream({
            async start(controller) {
              try {
                const reader = orResponse.body!.getReader();
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
              } catch {
                controller.enqueue(
                  new TextEncoder().encode("\n\n[AI Mentor connection interrupted. Try again.]"),
                );
              } finally {
                controller.close();
              }
            },
          });

          writeAnalytics("hint", "success", userId, "/api/console/hint", Date.now() - startTime, {
            model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          });
          return new Response(stream, {
            headers: { "Content-Type": "text/plain" },
          });
        } catch {
          writeAnalytics("hint", "error", null, "/api/console/hint", Date.now() - startTime);
          return new Response("AI Mentor error.", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
    },
  },
});
