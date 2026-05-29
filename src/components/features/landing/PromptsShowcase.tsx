import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  Radar,
  Code2,
  Server,
  FileCheck,
  Copy,
  Check,
  ChevronDown,
  Terminal,
} from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────── */

interface Prompt {
  id: string;
  category: string;
  categoryIcon: typeof ShieldCheck;
  title: string;
  description: string;
  prompt: string;
  usage: string;
  tags: string[];
}

interface Category {
  id: string;
  label: string;
  icon: typeof ShieldCheck;
  count: number;
}

/* ── Data ───────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  { id: "all", label: "All Prompts", icon: Terminal, count: 0 },
  { id: "security-audit", label: "Security Audit", icon: ShieldCheck, count: 0 },
  { id: "incident-response", label: "Incident Response", icon: AlertTriangle, count: 0 },
  { id: "threat-intel", label: "Threat Intel", icon: Radar, count: 0 },
  { id: "code-analysis", label: "Code Analysis", icon: Code2, count: 0 },
  { id: "infrastructure", label: "Infrastructure", icon: Server, count: 0 },
  { id: "compliance", label: "Compliance", icon: FileCheck, count: 0 },
];

const PROMPTS: Prompt[] = [
  {
    id: "audit-sessions",
    category: "security-audit",
    categoryIcon: ShieldCheck,
    title: "User Session Audit",
    description: "Audit all active user sessions across infrastructure for anomalies, privilege escalation, and policy violations.",
    usage: "Run during shift handover or after a suspected breach.",
    tags: ["sessions", "iam", "forensics"],
    prompt: `Audit all active user sessions across the entire infrastructure for the past [TIME_RANGE] hours.

For each session, report:
1. User identity and authentication method
2. Privilege escalations or role changes
3. Unusual geographic or network origin
4. Commands executed outside normal baseline
5. Policy violations or failed access attempts

Flag any session that matches known IOCs or behavioral anomalies. Output a severity-ranked summary with recommended remediation actions.`,
  },
  {
    id: "fw-audit",
    category: "security-audit",
    categoryIcon: ShieldCheck,
    title: "Firewall Policy Audit",
    description: "Review and validate firewall rule sets against least-privilege principles and compliance frameworks.",
    usage: "Weekly compliance sweep or before infrastructure changes.",
    tags: ["firewall", "network", "compliance"],
    prompt: `Perform a comprehensive audit of all firewall rule sets across [ENVIRONMENTS].

Requirements:
1. Identify overly permissive rules (0.0.0.0/0, any-any)
2. Flag rules that violate least-privilege principles
3. Detect shadowed, redundant, or expired rules
4. Validate rule ordering against intended policy
5. Compare against [COMPLIANCE_FRAMEWORK] baseline

Return a prioritized list of recommended changes with risk ratings and estimated blast radius.`,
  },
  {
    id: "incident-contain",
    category: "incident-response",
    categoryIcon: AlertTriangle,
    title: "Incident Containment",
    description: "Execute a structured containment sequence for an active security incident with isolation and evidence preservation.",
    usage: "Immediately upon confirmed breach or anomalous activity.",
    tags: ["containment", "isolation", "forensics"],
    prompt: `Execute incident containment procedures for the identified threat in [SECTOR/NODE].

Containment sequence:
1. Verify alert severity and scope
2. Isolate affected node from network (log all connections first)
3. Snapshot memory and disk for forensic analysis
4. Deploy sinkhole for C2 communication channels
5. Rotate exposed credentials and API tokens
6. Notify on-call incident response team

Do NOT: power off the node, modify files, or notify non-essential personnel before forensic acquisition is complete.`,
  },
  {
    id: "threat-hunt",
    category: "threat-intel",
    categoryIcon: Radar,
    title: "Threat Hunting Sweep",
    description: "Proactively search for indicators of compromise across endpoints, network flows, and log sources.",
    usage: "Daily proactive sweep or after receiving new threat intelligence.",
    tags: ["hunting", "ioc", "detection"],
    prompt: `Initiate a proactive threat hunting sweep across [SCOPE: endpoints|network|cloud].

Hunt parameters:
1. Search for IOCs from latest threat intelligence feeds
2. Identify unusual process ancestry chains
3. Detect beaconing patterns in outbound traffic
4. Find persistence mechanisms (scheduled tasks, services, registry)
5. Look for credential dumping or lateral movement artifacts
6. Correlate events across [TIME_RANGE] with MITRE ATT&CK mapping

Return findings grouped by tactic, scored by confidence level (low/medium/high/critical).`,
  },
  {
    id: "code-vuln",
    category: "code-analysis",
    categoryIcon: Code2,
    title: "Vulnerability Deep Scan",
    description: "Analyze source code or compiled artifacts for security vulnerabilities, hardcoded secrets, and logic flaws.",
    usage: "Pre-deployment CI/CD gate or quarterly security review.",
    tags: ["sca", "secrets", "static-analysis"],
    prompt: `Perform a deep security analysis of the provided codebase [REPO_PATH or SNIPPET].

Analysis scope:
1. Hardcoded credentials, API keys, and tokens
2. SQL injection, XSS, command injection vulnerabilities
3. Insecure deserialization and path traversal
4. Outdated dependencies with known CVEs
5. Insufficient input validation and sanitization
6. Logic flaws in authentication and authorization flows

For each finding, provide: location, severity, CVE reference (if applicable), and remediation suggestion with code example.`,
  },
  {
    id: "code-review",
    category: "code-analysis",
    categoryIcon: Code2,
    title: "Architecture Review",
    description: "Review code architecture for security, scalability, and adherence to best practices and design patterns.",
    usage: "PR review gate or architectural decision records.",
    tags: ["architecture", "review", "best-practices"],
    prompt: `Review the architecture of [PROJECT/COMPONENT] for security, scalability, and maintainability.

Evaluate:
1. Authentication and authorization model
2. Data flow and encryption boundaries
3. Error handling and logging practices
4. Dependency graph and supply chain risks
5. API surface area and exposure risks
6. State management and concurrency handling
7. Testing coverage for security-critical paths

Provide a heat-map of risk areas and prioritized recommendations.`,
  },
  {
    id: "infra-hardening",
    category: "infrastructure",
    categoryIcon: Server,
    title: "Infrastructure Hardening",
    description: "Generate a hardened configuration baseline across cloud, container, and on-premise infrastructure layers.",
    usage: "New environment setup or quarterly hardening cycle.",
    tags: ["hardening", "baseline", "cis"],
    prompt: `Generate a hardened configuration baseline for [ENVIRONMENT: kubernetes|aws|azure|on-prem].

Baseline must cover:
1. Identity and access management (least privilege, RBAC, MFA)
2. Network segmentation and micro-perimeter defense
3. Data encryption at rest and in transit
4. Logging, monitoring, and alerting configuration
5. Container and orchestration security (if applicable)
6. Backup and disaster recovery procedures
7. CIS benchmark compliance mapping

Output as a structured checklist with validation commands for each control.`,
  },
  {
    id: "compliance-audit",
    category: "compliance",
    categoryIcon: FileCheck,
    title: "Compliance Evidence Collection",
    description: "Automate the collection of audit evidence for SOC 2, ISO 27001, PCI-DSS, or custom frameworks.",
    usage: "Quarterly audit prep or continuous compliance monitoring.",
    tags: ["audit", "evidence", "soc2"],
    prompt: `Collect compliance evidence for [FRAMEWORK: SOC 2|ISO 27001|PCI-DSS|GDPR] across [SCOPE].

Evidence collection:
1. Access control reviews and IAM configuration snapshots
2. Change management logs and approval trails
3. Incident response exercise reports and post-mortems
4. Vulnerability scan results and remediation timelines
5. Vendor risk assessment documentation
6. Employee security training completion records
7. Data retention and deletion policy adherence

Format as a control-by-control evidence package with timestamps, owners, and remediation status.`,
  },
];

/* ── Compute category counts ───────────────────────────── */

const categoriesWithCounts = CATEGORIES.map((cat) => ({
  ...cat,
  count: cat.id === "all" ? PROMPTS.length : PROMPTS.filter((p) => p.category === cat.id).length,
}));

/* ── Single prompt card ─────────────────────────────────── */

function PromptCard({
  prompt,
  index,
}: {
  prompt: Prompt;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const Icon = prompt.categoryIcon;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface/30 transition-all duration-400",
        expanded
          ? "border-accent/30 shadow-[0_0_40px_-12px] shadow-accent/15"
          : "hover:border-border-strong hover:bg-surface/50",
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Collapsed card */}
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Icon */}
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-accent/20 bg-accent/5 text-accent">
          <Icon size={16} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {prompt.title}
            </h3>
            {/* Tags */}
            <div className="hidden gap-1.5 sm:flex">
              {prompt.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[9px] font-medium text-muted-foreground/70"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-1">
            {prompt.description}
          </p>
          <span className="mt-1.5 inline-block font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">
            {prompt.usage}
          </span>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "grid size-8 place-items-center rounded-lg border transition-all duration-200",
              copied
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-border bg-surface-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-accent/30 hover:text-accent",
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid size-8 place-items-center text-muted-foreground/40"
          >
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </div>

      {/* Expanded full prompt */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  Prompt Template
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[9px] font-medium transition-all",
                    copied
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-border bg-surface-2 text-muted-foreground hover:border-accent/30 hover:text-accent",
                  )}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap rounded-xl border border-border bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
                {prompt.prompt}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main showcase section ──────────────────────────────── */

export function PromptsShowcase() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let list = PROMPTS;

    if (activeCategory !== "all") {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q),
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex flex-col items-start gap-6"
        >
          <StatusPill tone="accent">Prompt Library</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Battle-tested prompts{" "}
            <span className="text-muted-foreground">for every operation.</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Pre-validated prompt templates crafted by CyberAI operators. Click any card to view
            the full template — copy and adapt for your environment.
          </p>
        </motion.div>

        {/* Search + filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 space-y-4"
        >
          {/* Search bar */}
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts by name, category, or tags..."
              className="w-full rounded-2xl border border-border bg-surface/50 py-3.5 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-all focus:border-accent/40 focus:shadow-[0_0_30px_-8px] focus:shadow-accent/20 font-mono"
            />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {categoriesWithCounts.map((cat) => {
              const active = activeCategory === cat.id;
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300",
                    active
                      ? "border-accent/30 bg-accent/10 text-accent shadow-[0_0_20px_-8px] shadow-accent/20"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
                  )}
                >
                  <CatIcon size={13} strokeWidth={1.5} />
                  {cat.label}
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 font-mono text-[9px]",
                      active ? "bg-accent/15" : "bg-surface-2 text-muted-foreground/60",
                    )}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Prompt list */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {filtered.map((p, i) => (
                <PromptCard key={p.id} prompt={p} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-2">
                <Search size={22} className="text-muted-foreground/40" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No prompts match your search. Try a different category or keyword.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
                className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-accent/80 transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
