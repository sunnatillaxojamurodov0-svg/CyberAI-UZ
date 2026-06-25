import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { jsonOk, jsonError, serverError } from "@/lib/api-response";
import {
  requireAuth,
  isAuthResponse,
  requireApiKey,
  isApiKeyResponse,
  withRateLimit,
  isRateLimitResponse,
  getClientIp,
} from "@/lib/api-middleware";

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
          const apiKey = requireApiKey("OPENROUTER_API_KEY", "AI service is not configured.");
          if (isApiKeyResponse(apiKey)) return apiKey;

          const rl = await withRateLimit(request, "threats", "chat", "/api/threats");
          if (isRateLimitResponse(rl)) return rl;

          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

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
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
            }),
          });

          if (!orResponse.ok) {
            return serverError("AI service error");
          }

          const orData = await orResponse.json();
          const response = orData.choices?.[0]?.message?.content || "";

          let threats: ThreatVector[];
          try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              threats = JSON.parse(jsonMatch[0]);
            } else {
              threats = JSON.parse(response);
            }
          } catch {
            return serverError("Failed to parse AI response");
          }

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

          return jsonOk({
            data: threats,
            meta: {
              generated_at: Date.now(),
              infrastructure: body.infrastructure ? "custom" : "general",
            },
          });
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
