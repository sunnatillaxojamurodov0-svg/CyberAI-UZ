import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
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
  Plus,
  X,
} from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────── */

interface Prompt {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  usage: string;
  tags: string[];
  isCustom?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: typeof ShieldCheck;
}

/* ── Data ───────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  { id: "security-audit", label: "Security Audit", icon: ShieldCheck },
  { id: "incident-response", label: "Incident Response", icon: AlertTriangle },
  { id: "threat-intel", label: "Threat Intel", icon: Radar },
  { id: "code-analysis", label: "Code Analysis", icon: Code2 },
  { id: "infrastructure", label: "Infrastructure", icon: Server },
  { id: "compliance", label: "Compliance", icon: FileCheck },
];

const PROMPTS: Prompt[] = [
  {
    id: "audit-sessions",
    category: "security-audit",
    title: "User Session Audit",
    description: "Audit all active user sessions across infrastructure for anomalies, privilege escalations, and policy violations.",
    usage: "Run during shift handover or after a suspected breach.",
    tags: ["sessions", "iam", "forensics"],
    prompt: `Audit all active user sessions across the entire infrastructure for the past [TIME_RANGE] hours.\n\nFor each session, report:\n1. User identity and authentication method\n2. Privilege escalations or role changes\n3. Unusual geographic or network origin\n4. Commands executed outside normal baseline\n5. Policy violations or failed access attempts\n\nFlag any session that matches known IOCs or behavioral anomalies. Output a severity-ranked summary with recommended remediation actions.`,
  },
  {
    id: "fw-audit",
    category: "security-audit",
    title: "Firewall Policy Audit",
    description: "Review and validate firewall rule sets against least-privilege principles and compliance frameworks.",
    usage: "Weekly compliance check or before infrastructure changes.",
    tags: ["firewall", "network", "compliance"],
    prompt: `Perform a comprehensive audit of all firewall rule sets across [ENVIRONMENTS].\n\nRequirements:\n1. Identify overly permissive rules (0.0.0.0/0, any-any)\n2. Flag rules that violate least-privilege principles\n3. Detect shadowed, redundant, or expired rules\n4. Validate rule ordering against intended policy\n5. Compare against [COMPLIANCE_FRAMEWORK] baseline\n\nReturn a prioritized list of recommended changes with risk ratings and estimated blast radius.`,
  },
  {
    id: "k8s-rbac",
    category: "security-audit",
    title: "Kubernetes RBAC Audit",
    description: "Audit Kubernetes RBAC configurations for privilege escalation, wildcard bindings, and excessive permissions.",
    usage: "Post-deployment validation or monthly security review.",
    tags: ["kubernetes", "rbac", "cluster"],
    prompt: `Audit Kubernetes RBAC configurations across all namespaces in cluster [CLUSTER_NAME].\n\nAudit scope:\n1. ClusterRoleBindings and RoleBindings with wildcard or * verbs\n2. Service account tokens with excessive permissions\n3. Users or groups bound to cluster-admin\n4. Impersonation privileges that enable privilege escalation\n5. Cross-namespace access via ClusterRole bindings\n\nReturn a risk-ranked table with namespace, binding name, subject, and remediation steps.`,
  },
  {
    id: "cloud-trail",
    category: "security-audit",
    title: "Cloud Trail Anomaly Detection",
    description: "Analyze CloudTrail / audit logs for anomalous API calls, privilege escalation, and unauthorized resource creation.",
    usage: "Daily security monitoring or post-incident forensic investigation.",
    tags: ["cloudtrail", "aws", "anomaly"],
    prompt: `Analyze CloudTrail logs from [ACCOUNT_ID / ORGANIZATION] for the past [TIME_RANGE].\n\nAnalysis focus:\n1. API calls from unusual geographies or IPs\n2. IAM role assumption chains that cross trust boundaries\n3. Creation of resources in unapproved regions\n4. Disablement or modification of logging services\n5. KMS key disabling or policy modification events\n6. Root activity and unexpected console logins\n\nFlag each event with risk score, implicated resources, and recommended investigation steps.`,
  },
  {
    id: "log-analysis",
    category: "security-audit",
    title: "Centralized Log Analysis",
    description: "Correlate logs from multiple sources (SIEM, endpoints, network) to detect complex attack chains.",
    usage: "During incident investigation or weekly threat sweep.",
    tags: ["siem", "correlation", "splunk"],
    prompt: `Correlate log data from [LOG_SOURCES: SIEM|EDR|Firewall|DNS|Proxy] for time range [TIME_RANGE].\n\nCorrelation objectives:\n1. Reconstruct attack kill chain from initial access to objective\n2. Identify timeline of events across disparate log sources\n3. Detect defense evasion techniques\n4. Map adversary behavior to MITRE ATT&CK framework\n5. Identify all affected hosts, users, and data repositories\n\nOutput a unified incident timeline with evidence citations and confidence level per detection.`,
  },
  {
    id: "incident-contain",
    category: "incident-response",
    title: "Incident Containment",
    description: "Execute a structured containment sequence with isolation and evidence preservation for an active security incident.",
    usage: "Immediately after confirmed breach or anomalous activity.",
    tags: ["containment", "isolation", "forensics"],
    prompt: `Execute incident containment procedures for the identified threat in [SECTOR/NODE].\n\nContainment sequence:\n1. Verify alert severity and scope\n2. Isolate affected node from network (log all connections first)\n3. Snapshot memory and disk for forensic analysis\n4. Deploy sinkhole for C2 communication channels\n5. Rotate exposed credentials and API tokens\n6. Notify on-call incident response team\n\nDo NOT: power off the node, modify files, or notify non-essential personnel before forensic acquisition.`,
  },
  {
    id: "malware-analysis",
    category: "incident-response",
    title: "Malware Analysis Pipeline",
    description: "Execute a structured malware analysis pipeline for suspicious binaries, scripts, or memory dumps.",
    usage: "When suspicious files are discovered or during incident investigation.",
    tags: ["malware", "reversing", "memory"],
    prompt: `Execute a malware analysis pipeline on the submitted sample [FILE_HASH or PATH].\n\nPipeline stages:\n1. Static analysis: file type, entropy, strings, imports, signatures\n2. Dynamic analysis: sandbox execution with network and process monitoring\n3. Memory analysis: volatility-based extraction of injected code\n4. Network analysis: C2 extraction, beacon frequency, protocol fingerprints\n5. YARA rule matching against known threat families\n6. MITRE ATT&CK technique mapping\n\nProvide a structured report with IoCs, detection signatures, and recommended response actions.`,
  },
  {
    id: "ransomware-response",
    category: "incident-response",
    title: "Ransomware Response Playbook",
    description: "Execute structured ransomware response including containment, negotiation preparation, and recovery procedures.",
    usage: "When ransomware is detected or immediately after encryption alert.",
    tags: ["ransomware", "containment", "recovery"],
    prompt: `Execute ransomware response procedures for the incident in [SECTOR/ORG].\n\nResponse phases:\n1. Identification: confirm encryption scope, ransomware variant, and infection vector\n2. Containment: isolate affected systems, block C2 infrastructure\n3. Eradication: remove persistence mechanisms, reset compromised credentials\n4. Recovery: restore from clean backups, verify data integrity\n5. Post-mortem: document timeline, extract IoCs, update defense signatures\n\nCritical: Do NOT pay ransom before exhausting all recovery options.`,
  },
  {
    id: "threat-hunt",
    category: "threat-intel",
    title: "Threat Hunting Sweep",
    description: "Proactively search for indicators of compromise across endpoints, network flows, and log sources.",
    usage: "Daily proactive scan or after receiving new threat intelligence.",
    tags: ["hunting", "ioc", "detection"],
    prompt: `Initiate a proactive threat hunting sweep across [SCOPE: endpoints|network|cloud].\n\nHunt parameters:\n1. Search for IOCs from latest threat intelligence feeds\n2. Identify unusual process ancestry chains\n3. Detect beaconing patterns in outbound traffic\n4. Find persistence mechanisms (scheduled tasks, services, registry)\n5. Look for credential dumping or lateral movement artifacts\n6. Correlate events across [TIME_RANGE] with MITRE ATT&CK mapping\n\nReturn findings grouped by tactic, scored by confidence level.`,
  },
  {
    id: "darkweb-threat",
    category: "threat-intel",
    title: "Dark Web Threat Intel",
    description: "Collect and correlate threat intelligence from dark web forums, marketplaces, and paste sites.",
    usage: "Weekly threat intelligence gathering or after a targeted alert.",
    tags: ["darkweb", "osint", "intelligence"],
    prompt: `Collect and analyze threat intelligence from dark web sources relevant to [ORG_NAME or SECTOR].\n\nCollection scope:\n1. Forum posts mentioning your domain, executives, or infrastructure\n2. Marketplace listings for stolen credentials or access\n3. Leaked internal documents or configuration files\n4. Discussions about vulnerabilities in your technology stack\n5. Ransomware gang disclosures and victim shaming posts\n\nCorrelate findings with known threat actor TTPs and provide risk assessment.`,
  },
  {
    id: "code-vuln",
    category: "code-analysis",
    title: "Vulnerability Deep Scan",
    description: "Analyze source code or compiled artifacts for security vulnerabilities, hardcoded secrets, and logic errors.",
    usage: "Pre-deployment CI/CD gate or quarterly security scan.",
    tags: ["sca", "secrets", "static-analysis"],
    prompt: `Perform a deep security analysis of the provided codebase [REPO_PATH or SNIPPET].\n\nAnalysis scope:\n1. Hardcoded credentials, API keys, and tokens\n2. SQL injection, XSS, command injection vulnerabilities\n3. Insecure deserialization and path traversal\n4. Outdated dependencies with known CVEs\n5. Insufficient input validation and sanitization\n6. Logic flaws in authentication and authorization flows\n\nFor each finding, provide: location, severity, CVE reference, and remediation suggestion.`,
  },
  {
    id: "api-security",
    category: "code-analysis",
    title: "API Security Assessment",
    description: "Assess REST, GraphQL, or gRPC API endpoints for authentication flaws, injection, and data exposure risks.",
    usage: "Pre-production API review or external penetration test.",
    tags: ["api", "graphql", "rest"],
    prompt: `Perform a security assessment of the API surface at [API_BASE_URL or SPEC_PATH].\n\nAssessment scope:\n1. Authentication and authorization bypass attempts\n2. Rate limiting and brute force protection\n3. Injection vulnerabilities (SQL, NoSQL, command, LDAP)\n4. Mass assignment and IDOR in POST/PUT endpoints\n5. Excessive data exposure in responses\n6. GraphQL introspection and depth-limit testing\n7. JWT token handling and secret key strength\n\nProvide a severity-graded report with proof-of-concept requests and fixes.`,
  },
  {
    id: "infra-hardening",
    category: "infrastructure",
    title: "Infrastructure Hardening",
    description: "Generate a hardened configuration baseline across cloud, container, and on-premise infrastructure layers.",
    usage: "New environment setup or quarterly hardening cycle.",
    tags: ["hardening", "baseline", "cis"],
    prompt: `Generate a hardened configuration baseline for [ENVIRONMENT: kubernetes|aws|azure|on-prem].\n\nBaseline must cover:\n1. Identity and access management (least privilege, RBAC, MFA)\n2. Network segmentation and micro-perimeter defense\n3. Data encryption at rest and in transit\n4. Logging, monitoring, and alerting configuration\n5. Container and orchestration security\n6. Backup and disaster recovery procedures\n7. CIS benchmark compliance mapping\n\nOutput as a structured checklist with validation commands for each control.`,
  },
  {
    id: "container-scan",
    category: "infrastructure",
    title: "Container Security Scan",
    description: "Scan container images and runtime configurations for vulnerabilities, misconfigurations, and policy violations.",
    usage: "CI/CD pipeline gate or registry scan.",
    tags: ["docker", "containers", "supply-chain"],
    prompt: `Scan container images and runtime configurations in [REGISTRY or NAMESPACE].\n\nScan parameters:\n1. OS-level CVEs in base images and installed packages\n2. Language-specific dependency vulnerabilities\n3. Hardcoded secrets in image layers\n4. Container runtime privilege escalations\n5. Unnecessary capabilities and root user execution\n6. Image signing and provenance verification\n\nOutput a vulnerability report grouped by severity with fix versions.`,
  },
  {
    id: "compliance-audit",
    category: "compliance",
    title: "Compliance Evidence Collection",
    description: "Automate audit evidence collection for SOC 2, ISO 27001, PCI-DSS, or custom frameworks.",
    usage: "Quarterly audit preparation or continuous compliance monitoring.",
    tags: ["audit", "evidence", "soc2"],
    prompt: `Collect compliance evidence for [FRAMEWORK: SOC 2|ISO 27001|PCI-DSS|GDPR] across [SCOPE].\n\nEvidence collection:\n1. Access control reviews and IAM configuration snapshots\n2. Change management logs and approval trails\n3. Incident response exercise reports\n4. Vulnerability scan results and remediation timelines\n5. Vendor risk assessment documentation\n6. Employee security training completion records\n7. Data retention and deletion policy adherence\n\nFormat as a control-by-control evidence package with timestamps and owners.`,
  },
  {
    id: "gdpr-audit",
    category: "compliance",
    title: "GDPR Data Map",
    description: "Map data flows, processing activities, and consent mechanisms to demonstrate GDPR compliance.",
    usage: "Annual GDPR audit or before entering EU markets.",
    tags: ["gdpr", "privacy", "data"],
    prompt: `Conduct a GDPR compliance audit across [SCOPE: all systems handling EU personal data].\n\nAudit requirements:\n1. Data flow mapping: collection, processing, storage, transfer, deletion\n2. Consent mechanism review and withdrawal handling\n3. Data Subject Access Request (DSAR) process and SLA\n4. Data Processing Agreement (DPA) status with all sub-processors\n5. Breach notification procedure and 72-hour reporting capability\n6. Data retention schedules and secure deletion procedures\n7. Privacy Impact Assessment (PIA) for high-risk processing\n\nProvide a gap analysis with remediation roadmap and evidence artifacts.`,
  },
  {
    id: "pci-audit",
    category: "compliance",
    title: "PCI-DSS Quarterly Scan",
    description: "Validate PCI-DSS compliance for cardholder data environments including ASV scanning and evidence collection.",
    usage: "Quarterly compliance validation or after infrastructure changes to the CDE.",
    tags: ["pci", "cde", "asv"],
    prompt: `Conduct a PCI-DSS compliance validation for the cardholder data environment (CDE) at [SCOPE].\n\nValidation scope:\n1. Network segmentation verification between CDE and non-CDE\n2. ASV vulnerability scan results review\n3. Access control review for systems handling cardholder data\n4. Encryption strength verification for stored PAN and transmission\n5. Logging and monitoring coverage for all CDE systems\n6. Physical security controls for data center access\n\nProvide a control-by-control compliance status with evidence artifacts.`,
  },
];

/* ── Single prompt item ─────────────────────────────────── */

function PromptItem({ prompt, index }: { prompt: Prompt; index: number }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={cn(
        "group cursor-pointer rounded-xl border transition-all duration-200",
        expanded
          ? "border-border bg-surface/60"
          : "border-border/60 bg-surface/30 hover:border-border hover:bg-surface/50",
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header row */}
          <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground truncate">{prompt.title}</h4>
            <div className="hidden gap-1 sm:flex">
              {prompt.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{prompt.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "grid size-7 place-items-center rounded-lg border transition-all duration-200",
              copied
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-surface-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary",
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="grid size-7 place-items-center text-muted-foreground/50"
          >
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </div>

      {/* Expanded prompt */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Prompt Template
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px] font-medium transition-all",
                    copied
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-surface-2 text-muted-foreground hover:text-primary",
                  )}
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2/80 p-3 font-mono text-[10px] leading-relaxed text-foreground/80">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, Prompt[]> = {};

    for (const cat of CATEGORIES) {
      groups[cat.id] = PROMPTS.filter((p) => p.category === cat.id);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      for (const catId of Object.keys(groups)) {
        groups[catId] = groups[catId].filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)),
        );
      }
    }

    if (activeCategory) {
      for (const catId of Object.keys(groups)) {
        if (catId !== activeCategory) groups[catId] = [];
      }
    }

    return groups;
  }, [searchQuery, activeCategory]);

  const totalCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <StatusPill tone="accent">Prompts Library</StatusPill>
          <h2 className="mt-6 max-w-3xl font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl">
            Battle-ready prompts <span className="text-muted-foreground">for every operation.</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Pre-approved prompt templates developed by CyberAI operators. Copy and adapt to your environment.
          </p>
        </motion.div>

        {/* Search + category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 space-y-3"
        >
          {/* Search */}
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full rounded-xl border border-border bg-surface/50 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-all focus:border-primary/40 font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                !activeCategory
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              <Terminal size={12} />
              All
              <span className="font-mono text-[9px] opacity-60">{PROMPTS.length}</span>
            </button>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              const CatIcon = cat.icon;
              const count = PROMPTS.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CatIcon size={12} />
                  {cat.label}
                  <span className="font-mono text-[9px] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Grouped prompt list */}
        <AnimatePresence mode="wait">
          {totalCount > 0 ? (
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {CATEGORIES.map((cat) => {
                const items = grouped[cat.id];
                if (!items || items.length === 0) return null;
                const CatIcon = cat.icon;
                return (
                  <div key={cat.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <CatIcon size={13} className="text-primary" />
                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                        {cat.label}
                      </h3>
                      <span className="font-mono text-[9px] text-muted-foreground/50">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((p, i) => (
                        <PromptItem key={p.id} prompt={p} index={i} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="grid size-12 place-items-center rounded-xl border border-border bg-surface-2">
                <Search size={18} className="text-muted-foreground/40" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                No prompts found. Try a different search or category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery("");
                }}
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* More link */}
        {totalCount > 0 && (
          <div className="flex justify-center pt-6">
            <Link
              to="/prompts"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 hover:border-primary/40"
            >
              View All Prompts
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
