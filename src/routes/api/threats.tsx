import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";

interface ThreatVector {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  technique: string;
  mitigation: string;
  cve?: string;
  references?: string[];
}

export const Route = createFileRoute("/api/threats")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const ai = env.AI as Ai | undefined;
          if (!ai) {
            return new Response("AI service is not configured.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const startTime = Date.now();
          const rl = await checkRateLimit(rateLimitKey(ip, "threats"), "chat");
          if (!rl.allowed) {
            return new Response("Too many requests. Try again later.", {
              status: 429,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response("Authentication required.", {
              status: 401,
              headers: { "Content-Type": "text/plain" },
            });
          }

          const body = (await request.json()) as {
            infrastructure?: string;
            focus?: string[];
          };

          const systemPrompt = `You are an expert cybersecurity threat analyst. Generate realistic threat vectors based on the provided infrastructure description.

For each threat vector, provide:
1. A unique ID (format: TV-XXXX)
2. Name (concise)
3. Description (2-3 sentences)
4. Severity (low/medium/high/critical)
5. Category (e.g., "network", "web", "social", "physical", "insider")
6. Technique (specific attack technique or MITRE ATT&CK mapping)
7. Mitigation (1-2 sentences on how to defend against it)
8. Optional CVE reference if applicable
9. Optional references/links

Generate 5-8 realistic threat vectors. Focus on practical, actionable threats.

Return ONLY valid JSON array of threat vectors. No markdown, no explanation.`;

          const prompt = body.infrastructure
            ? `Analyze this infrastructure and generate threat vectors:\n\n${body.infrastructure}`
            : `Generate general threat vectors for a modern enterprise environment with:
- Cloud services (AWS/Azure/GCP)
- Web applications
- Internal network
- Remote workers
- Third-party integrations`;

          const aiResponse = await ai.run("@cf/meta/llama-3.2-3b-instruct", {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
          });

          const responseText = (aiResponse as { response?: string }).response || "";

          // Parse the JSON response
          let threats: ThreatVector[];
          try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              threats = JSON.parse(jsonMatch[0]);
            } else {
              threats = JSON.parse(responseText);
            }
          } catch {
            // If parsing fails, return a formatted error
            return new Response(
              JSON.stringify({ ok: false, error: "Failed to parse AI response" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          // Validate and sanitize the threats
          threats = threats.map((t) => ({
            id: t.id || `TV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            name: t.name || "Unknown Threat",
            description: t.description || "No description available",
            severity: ["low", "medium", "high", "critical"].includes(t.severity)
              ? t.severity
              : "medium",
            category: t.category || "general",
            technique: t.technique || "Unknown technique",
            mitigation: t.mitigation || "Consult security documentation",
            cve: t.cve,
            references: t.references,
          }));

          return new Response(
            JSON.stringify({
              ok: true,
              data: threats,
              meta: {
                generated_at: Date.now(),
                infrastructure: body.infrastructure ? "custom" : "general",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : "Failed to generate threats",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
