/* ── Simulated tool handlers (showcase purple ToolUseCard UI) ── */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ToolResult {
  name: string;
  result: string;
  duration: number;
}

export const TOOL_HANDLERS: Record<string, () => Promise<ToolResult>> = {
  "Web Search": async () => {
    await sleep(1800 + Math.random() * 600);
    return {
      name: "Web Search",
      duration: Math.floor(1800 + Math.random() * 600),
      result: `Found 3 relevant results:
1. docs.cyberai.dev/architecture — "The sovereign stack uses a layered defense model with real-time threat correlation."
2. research.cyberai.dev/latest — "Autonomous response times improved 340% in Q1 2026."
3. status.cyberai.dev — "All orbital sectors nominal. 99.97% uptime this quarter."`,
    };
  },
  "Python Sandbox": async () => {
    await sleep(2200 + Math.random() * 800);
    return {
      name: "Python Sandbox",
      duration: Math.floor(2200 + Math.random() * 800),
      result: `>>> import cyberai.security as cs
>>> session = cs.AuditSession("orbital-001")
>>> anomalies = session.scan(time_range="24h")
>>> print(f"Found {len(anomalies)} anomalies")
Found 3 anomalies
>>> for a in anomalies:
...     print(f"  [{a.severity}] {a.description}")
  [HIGH] Unauthorized key rotation attempt — sector EU-WEST-2
  [MED]  Deprecated cipher suite detected on gateway-03
  [LOW]  Stale DNS cache entry for node-42`,
    };
  },
  "Database Query": async () => {
    await sleep(1200 + Math.random() * 400);
    return {
      name: "Database Query",
      duration: Math.floor(1200 + Math.random() * 400),
      result: `Query: SELECT node, status, last_seen, region FROM orbital_nodes WHERE status != 'active' ORDER BY last_seen DESC LIMIT 5;

│ node       │ status     │ last_seen           │ region      │
│────────────│────────────│─────────────────────│─────────────│
│ node-042   │ draining   │ 2026-05-27 14:32:01 │ EU-WEST-2   │
│ node-107   │ pending    │ 2026-05-27 13:15:44 │ US-EAST-1   │
│ node-089   │ degraded   │ 2026-05-27 11:08:22 │ AP-SOUTH-1  │
│ node-156   │ rebooting  │ 2026-05-27 09:45:13 │ EU-WEST-2   │
│ node-201   │ offline    │ 2026-05-26 22:30:07 │ US-WEST-2   │`,
    };
  },
  "Threat Intel": async () => {
    await sleep(2500 + Math.random() * 500);
    return {
      name: "Threat Intel",
      duration: Math.floor(2500 + Math.random() * 500),
      result: `Threat Brief — 2026-05-27 14:00 UTC
─────────────────────────────────────
Level:     GUARDED (2/5)
Sectors:   EU-WEST-2, US-EAST-1

Active Campaigns:
• CVE-2026-2744 — Proof-of-concept detected in the wild. Affects edge gateway firmware < v3.8.1.
• Phishing cluster "SPECTRAL_HARVEST" targeting infrastructure tokens. 14 domains flagged.
• Unusual outbound traffic pattern from node-042. Quarantine recommended.

Recommendation: Patch gateways to v3.8.1 and rotate all service tokens.`,
    };
  },
};

/* ── Intent → tool mapping ──────────────────────────────── */

export const TOOL_MAP: Record<string, string[]> = {
  default: [],
  search: ["Web Search", "Threat Intel"],
  scan: ["Python Sandbox", "Database Query", "Threat Intel"],
  query: ["Database Query"],
  code: ["Python Sandbox"],
};

/* ── Intent classification ──────────────────────────────── */

export function classifyIntent(input: string): string {
  const lower = input.toLowerCase();
  if (/search|find|lookup|threat|intel|intelligence/i.test(lower)) return "search";
  if (/scan|audit|analyze|inspect|sweep/i.test(lower)) return "scan";
  if (/query|select|database|db|table|node|status/i.test(lower)) return "query";
  if (/run|execute|code|sandbox|python|script|compute/i.test(lower)) return "code";
  return "default";
}
