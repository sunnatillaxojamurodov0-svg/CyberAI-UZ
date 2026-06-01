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
    description: "Audit all active user sessions across infrastructure for anomalies, privilege escalations, and policy violations.",
    usage: "Run during shift handover or after a suspected breach.",
    tags: ["sessions", "iam", "forensics"],
    prompt: `Audit all active user sessions across the entire infrastructure for the past [TIME_RANGE] hours.\n\nFor each session, report:\n1. User identity and authentication method\n2. Privilege escalations or role changes\n3. Unusual geographic or network origin\n4. Commands executed outside normal baseline\n5. Policy violations or failed access attempts\n\nFlag any session that matches known IOCs or behavioral anomalies. Output a severity-ranked summary with recommended remediation actions.`,
  },
  {
    id: "fw-audit",
    category: "security-audit",
    categoryIcon: ShieldCheck,
    title: "Firewall Policy Audit",
    description: "Review and validate firewall rule sets against least-privilege principles and compliance frameworks.",
    usage: "Weekly compliance check or before infrastructure changes.",
    tags: ["firewall", "network", "compliance"],
    prompt: `Perform a comprehensive audit of all firewall rule sets across [ENVIRONMENTS].\n\nRequirements:\n1. Identify overly permissive rules (0.0.0.0/0, any-any)\n2. Flag rules that violate least-privilege principles\n3. Detect shadowed, redundant, or expired rules\n4. Validate rule ordering against intended policy\n5. Compare against [COMPLIANCE_FRAMEWORK] baseline\n\nReturn a prioritized list of recommended changes with risk ratings and estimated blast radius.`,
  },
  {
    id: "incident-contain",
    category: "incident-response",
    categoryIcon: AlertTriangle,
    title: "Incident Containment",
    description: "Execute a structured containment sequence with isolation and evidence preservation for an active security incident.",
    usage: "Immediately after confirmed breach or anomalous activity.",
    tags: ["containment", "isolation", "forensics"],
    prompt: `Execute incident containment procedures for the identified threat in [SECTOR/NODE].\n\nContainment sequence:\n1. Verify alert severity and scope\n2. Isolate affected node from network (log all connections first)\n3. Snapshot memory and disk for forensic analysis\n4. Deploy sinkhole for C2 communication channels\n5. Rotate exposed credentials and API tokens\n6. Notify on-call incident response team\n\nDo NOT: power off the node, modify files, or notify non-essential personnel before forensic acquisition is complete.`,
  },
  {
    id: "threat-hunt",
    category: "threat-intel",
    categoryIcon: Radar,
    title: "Threat Hunting Sweep",
    description: "Proactively search for indicators of compromise across endpoints, network flows, and log sources.",
    usage: "Daily proactive scan or after receiving new threat intelligence.",
    tags: ["hunting", "ioc", "detection"],
    prompt: `Initiate a proactive threat hunting sweep across [SCOPE: endpoints|network|cloud].\n\nHunt parameters:\n1. Search for IOCs from latest threat intelligence feeds\n2. Identify unusual process ancestry chains\n3. Detect beaconing patterns in outbound traffic\n4. Find persistence mechanisms (scheduled tasks, services, registry)\n5. Look for credential dumping or lateral movement artifacts\n6. Correlate events across [TIME_RANGE] with MITRE ATT&CK mapping\n\nReturn findings grouped by tactic, scored by confidence level (low/medium/high/critical).`,
  },
  {
    id: "code-vuln",
    category: "code-analysis",
    categoryIcon: Code2,
    title: "Vulnerability Deep Scan",
    description: "Analyze source code or compiled artifacts for security vulnerabilities, hardcoded secrets, and logic errors.",
    usage: "Pre-deployment CI/CD gate or quarterly security scan.",
    tags: ["sca", "secrets", "static-analysis"],
    prompt: `Perform a deep security analysis of the provided codebase [REPO_PATH or SNIPPET].\n\nAnalysis scope:\n1. Hardcoded credentials, API keys, and tokens\n2. SQL injection, XSS, command injection vulnerabilities\n3. Insecure deserialization and path traversal\n4. Outdated dependencies with known CVEs\n5. Insufficient input validation and sanitization\n6. Logic flaws in authentication and authorization flows\n\nFor each finding, provide: location, severity, CVE reference (if applicable), and remediation suggestion with code example.`,
  },
  {
    id: "code-review",
    category: "code-analysis",
    categoryIcon: Code2,
    title: "Architecture Review",
    description: "Review application architecture for security, scalability, and adherence to best practices and design patterns.",
    usage: "PR review gate or architecture decision records.",
    tags: ["architecture", "review", "best-practices"],
    prompt: `Review the architecture of [PROJECT/COMPONENT] for security, scalability, and maintainability.\n\nEvaluate:\n1. Authentication and authorization model\n2. Data flow and encryption boundaries\n3. Error handling and logging practices\n4. Dependency graph and supply chain risks\n5. API surface area and exposure risks\n6. State management and concurrency handling\n7. Testing coverage for security-critical paths\n\nProvide a heat-map of risk areas and prioritized recommendations.`,
  },
  {
    id: "infra-hardening",
    category: "infrastructure",
    categoryIcon: Server,
    title: "Infrastructure Hardening",
    description: "Generate a hardened configuration baseline across cloud, container, and on-premise infrastructure layers.",
    usage: "New environment setup or quarterly hardening cycle.",
    tags: ["hardening", "baseline", "cis"],
    prompt: `Generate a hardened configuration baseline for [ENVIRONMENT: kubernetes|aws|azure|on-prem].\n\nBaseline must cover:\n1. Identity and access management (least privilege, RBAC, MFA)\n2. Network segmentation and micro-perimeter defense\n3. Data encryption at rest and in transit\n4. Logging, monitoring, and alerting configuration\n5. Container and orchestration security (if applicable)\n6. Backup and disaster recovery procedures\n7. CIS benchmark compliance mapping\n\nOutput as a structured checklist with validation commands for each control.`,
  },
  {
    id: "compliance-audit",
    category: "compliance",
    categoryIcon: FileCheck,
    title: "Compliance Evidence Collection",
    description: "Automate audit evidence collection for SOC 2, ISO 27001, PCI-DSS, or custom frameworks.",
    usage: "Quarterly audit preparation or continuous compliance monitoring.",
    tags: ["audit", "evidence", "soc2"],
    prompt: `Collect compliance evidence for [FRAMEWORK: SOC 2|ISO 27001|PCI-DSS|GDPR] across [SCOPE].\n\nEvidence collection:\n1. Access control reviews and IAM configuration snapshots\n2. Change management logs and approval trails\n3. Incident response exercise reports and post-mortems\n4. Vulnerability scan results and remediation timelines\n5. Vendor risk assessment documentation\n6. Employee security training completion records\n7. Data retention and deletion policy adherence\n\nFormat as a control-by-control evidence package with timestamps, owners, and remediation status.`,
  },
  {
    id: "k8s-rbac",
    category: "security-audit",
    categoryIcon: ShieldCheck,
    title: "Kubernetes RBAC Audit",
    description: "Audit Kubernetes RBAC configurations for privilege escalation, wildcard bindings, and excessive permissions.",
    usage: "Post-deployment validation or monthly security review.",
    tags: ["kubernetes", "rbac", "cluster"],
    prompt: `Audit Kubernetes RBAC configurations across all namespaces in cluster [CLUSTER_NAME].\n\nAudit scope:\n1. ClusterRoleBindings and RoleBindings with wildcard or * verbs\n2. Service account tokens with excessive permissions\n3. Users or groups bound to cluster-admin\n4. Impersonation privileges that enable privilege escalation\n5. Cross-namespace access via ClusterRole bindings\n6. Default service accounts with unnecessary roles\n\nReturn a risk-ranked table with namespace, binding name, subject, and remediation steps.`,
  },
  {
    id: "malware-analysis",
    category: "incident-response",
    categoryIcon: AlertTriangle,
    title: "Malware Analysis Pipeline",
    description: "Execute a structured malware analysis pipeline for suspicious binaries, scripts, or memory dumps.",
    usage: "When suspicious files are discovered or during incident investigation.",
    tags: ["malware", "reversing", "memory"],
    prompt: `Execute a malware analysis pipeline on the submitted sample [FILE_HASH or PATH].\n\nPipeline stages:\n1. Static analysis: file type, entropy, strings, imports, signatures\n2. Dynamic analysis: sandbox execution with network and process monitoring\n3. Memory analysis: volatility-based extraction of injected code and hooks\n4. Network analysis: C2 extraction, beacon frequency, protocol fingerprints\n5. YARA rule matching against known threat families\n6. MITRE ATT&CK technique mapping\n\nProvide a structured report with IoCs, detection signatures, and recommended response actions.`,
  },
  {
    id: "darkweb-threat",
    category: "threat-intel",
    categoryIcon: Radar,
    title: "Dark Web Threat Intel",
    description: "Collect and correlate threat intelligence from dark web forums, marketplaces, and paste sites related to your organization.",
    usage: "Weekly threat intelligence gathering or after a targeted alert.",
    tags: ["darkweb", "osint", "intelligence"],
    prompt: `Collect and analyze threat intelligence from dark web sources relevant to [ORG_NAME or SECTOR].\n\nCollection scope:\n1. Forum posts mentioning your domain, executives, or infrastructure\n2. Marketplace listings for stolen credentials, certificates, or access\n3. Leaked internal documents, source code, or configuration files\n4. Discussions about vulnerabilities in your technology stack\n5. Ransomware gang disclosures and victim shaming posts\n6. Telegram and IRC channels targeting your industry\n\nCorrelate findings with known threat actor TTPs and provide risk assessment.`,
  },
  {
    id: "api-security",
    category: "code-analysis",
    categoryIcon: Code2,
    title: "API Security Assessment",
    description: "Assess REST, GraphQL, or gRPC API endpoints for authentication flaws, injection, and data exposure risks.",
    usage: "Pre-production API review or external penetration test.",
    tags: ["api", "graphql", "rest"],
    prompt: `Perform a security assessment of the API surface at [API_BASE_URL or SPEC_PATH].\n\nAssessment scope:\n1. Authentication and authorization bypass attempts\n2. Rate limiting and brute force protection\n3. Injection vulnerabilities (SQL, NoSQL, command, LDAP)\n4. Mass assignment and IDOR in POST/PUT endpoints\n5. Excessive data exposure in responses\n6. GraphQL introspection and depth-limit testing\n7. JWT token handling and secret key strength\n8. CORS, CSRF, and security header configuration\n\nProvide a severity-graded report with proof-of-concept requests and fixes.`,
  },
  {
    id: "container-scan",
    category: "infrastructure",
    categoryIcon: Server,
    title: "Container Security Scan",
    description: "Scan container images and runtime configurations for vulnerabilities, misconfigurations, and policy violations.",
    usage: "CI/CD pipeline gate or registry scan.",
    tags: ["docker", "containers", "supply-chain"],
    prompt: `Scan container images and runtime configurations in [REGISTRY or NAMESPACE].\n\nScan parameters:\n1. OS-level CVEs in base images and installed packages\n2. Language-specific dependency vulnerabilities\n3. Hardcoded secrets in image layers\n4. Container runtime privilege escalations\n5. Unnecessary capabilities and root user execution\n6. Immutable filesystem and read-only root enforcement\n7. Image signing and provenance verification\n\nOutput a vulnerability report grouped by severity with fix versions and remediation commands.`,
  },
  {
    id: "gdpr-audit",
    category: "compliance",
    categoryIcon: FileCheck,
    title: "GDPR Data Map",
    description: "Map data flows, processing activities, and consent mechanisms to demonstrate GDPR compliance.",
    usage: "Annual GDPR audit or before entering EU markets.",
    tags: ["gdpr", "privacy", "data"],
    prompt: `Conduct a GDPR compliance audit across [SCOPE: all systems handling EU personal data].\n\nAudit requirements:\n1. Data flow mapping: collection, processing, storage, transfer, deletion\n2. Consent mechanism review and withdrawal handling\n3. Data Subject Access Request (DSAR) process and SLA\n4. Data Processing Agreement (DPA) status with all sub-processors\n5. Breach notification procedure and 72-hour reporting capability\n6. Data retention schedules and secure deletion procedures\n7. Privacy Impact Assessment (PIA) for high-risk processing\n\nProvide a gap analysis with remediation roadmap and evidence artifacts.`,
  },
  {
    id: "cloud-trail",
    category: "security-audit",
    categoryIcon: ShieldCheck,
    title: "Cloud Trail Anomaly Detection",
    description: "Analyze CloudTrail / audit logs for anomalous API calls, privilege escalation, and unauthorized resource creation.",
    usage: "Daily security monitoring or post-incident forensic investigation.",
    tags: ["cloudtrail", "aws", "anomaly"],
    prompt: `Analyze CloudTrail logs from [ACCOUNT_ID / ORGANIZATION] for the past [TIME_RANGE].\n\nAnalysis focus:\n1. API calls from unusual geographies or IPs\n2. IAM role assumption chains that cross trust boundaries\n3. Creation of resources in unapproved regions\n4. Disablement or modification of logging and monitoring services\n5. KMS key disabling or policy modification events\n6. Root activity and unexpected console logins\n7. Network ACL and security group changes that widen access\n\nFlag each event with risk score, implicated resources, and recommended investigation steps.`,
  },
  {
    id: "ransomware-response",
    category: "incident-response",
    categoryIcon: AlertTriangle,
    title: "Ransomware Response Playbook",
    description: "Execute structured ransomware response including containment, negotiation preparation, and recovery procedures.",
    usage: "When ransomware is detected or immediately after encryption alert.",
    tags: ["ransomware", "containment", "recovery"],
    prompt: `Execute ransomware response procedures for the incident in [SECTOR/ORG].\n\nResponse phases:\n1. Identification: confirm encryption scope, ransomware variant, and infection vector\n2. Containment: isolate affected systems, block C2 infrastructure, disable SMB/WMI\n3. Eradication: remove persistence mechanisms, reset compromised credentials\n4. Recovery: restore from clean backups, verify data integrity, patch entry vector\n5. Post-mortem: document timeline, extract IoCs, update defense signatures\n\nCritical: Do NOT pay ransom before exhausting all recovery options. Preserve forensic evidence of the encryption artifact and ransom note.`,
  },
  {
    id: "network-threat",
    category: "threat-intel",
    categoryIcon: Radar,
    title: "Network Threat Correlation",
    description: "Correlate network flow logs with threat intelligence feeds to detect C2 communication and data exfiltration.",
    usage: "Continuous monitoring or after detecting suspicious outbound traffic.",
    tags: ["network", "c2", "exfiltration"],
    prompt: `Correlate network flow data from [SENSOR/NETWORK_SEGMENT] with active threat intelligence feeds.\n\nCorrelation parameters:\n1. Beaconing detection: periodic outbound connections to unknown IPs\n2. DGA domain resolution patterns\n3. Data exfiltration via DNS tunneling or large outbound transfers\n4. Connections to known malicious IPs, ASNs, or TLS certificate fingerprints\n5. Unusual protocol usage on standard ports\n6. Encrypted traffic to non-standard destinations\n7. Peer-to-peer C2 communication patterns\n\nProvide a heatmap of compromised or suspicious hosts with confidence scoring.`,
  },
  {
    id: "iac-scan",
    category: "code-analysis",
    categoryIcon: Code2,
    title: "IaC Security Analysis",
    description: "Scan Terraform, CloudFormation, and Pulumi templates for security misconfigurations and compliance violations.",
    usage: "Pre-deployment CI/CD gate or infrastructure audit.",
    tags: ["terraform", "iac", "devsecops"],
    prompt: `Scan Infrastructure-as-Code templates in [REPO_PATH] for security misconfigurations.\n\nScan scope:\n1. Publicly exposed storage buckets and databases\n2. IAM policies granting wildcard or overly permissive access\n3. Security group and firewall rules with 0.0.0.0/0 ingress\n4. Encryption disabled for data at rest or in transit\n5. Logging and monitoring configuration gaps\n6. Hardcoded secrets and sensitive values\n7. Compliance violations against [CIS|SOC2|PCI] baseline\n\nFor each finding, provide: file path, line number, severity, and remediation code snippet.`,
  },
  {
    id: "iam-review",
    category: "infrastructure",
    categoryIcon: Server,
    title: "IAM Policy Review",
    description: "Review and simplify IAM policies across cloud providers to eliminate privilege creep and unused permissions.",
    usage: "Quarterly access review or after organizational changes.",
    tags: ["iam", "access", "least-privilege"],
    prompt: `Review IAM policies across [PROVIDER: AWS|Azure|GCP] for account [ACCOUNT_ID].\n\nReview criteria:\n1. Users, roles, and groups with unused permissions over [N] days\n2. Policies with wildcard actions (*) or resources (*)\n3. Service-linked roles with excessive trust policies\n4. Cross-account access that is no longer required\n5. Inline policies that should be converted to managed policies\n6. Permission boundaries that are not enforced\n7. Access keys older than [N] days without rotation\n\nGenerate a least-privilege policy set with before/after diff for each recommendation.`,
  },
  {
    id: "forensic-acquisition",
    category: "incident-response",
    categoryIcon: AlertTriangle,
    title: "Forensic Acquisition",
    description: "Perform forensic collection of volatile and non-volatile data from compromised systems with chain of custody.",
    usage: "Incident response or legal hold situations.",
    tags: ["forensics", "acquisition", "chain-of-custody"],
    prompt: `Perform forensic acquisition on host [HOSTNAME or IP] for incident [INCIDENT_ID].\n\nAcquisition order (volatile first):\n1. Memory dump via [winpmem|avml|liME] with SHA256 hash\n2. Running processes and network connections\n3. Active network sockets and listening services\n4. Scheduled tasks and cron jobs\n5. Event logs and system logs (Windows Event Log, syslog, journald)\n6. Registry hives (Windows) or configuration directories (Linux)\n7. Full disk image or targeted file collection\n8. Browser history and prefetch files\n\nDocument all commands executed, hash values, and chain-of-custody forms.`,
  },
  {
    id: "zero-day-research",
    category: "threat-intel",
    categoryIcon: Radar,
    title: "Zero-Day Threat Assessment",
    description: "Assess the impact and exploitability of newly disclosed vulnerabilities in your technology stack.",
    usage: "When a critical CVE or vendor advisory is published.",
    tags: ["zeroday", "cve", "risk"],
    prompt: `Assess the impact of [CVE_ID or VULNERABILITY_NAME] on our environment.\n\nAssessment parameters:\n1. Affected software versions in our inventory\n2. Exploitation complexity and weaponization status\n3. Public PoC or exploit availability\n4. Potential blast radius and data exposure\n5. Existing compensating controls or WAF/IPS signatures\n6. Vendor patch availability and deployment timeline\n7. Temporary mitigation measures (configuration changes, network segmentation)\n\nProvide a risk score (Critical/High/Medium/Low), recommended response timeline, and step-by-step mitigation plan.`,
  },
  {
    id: "log-analysis",
    category: "security-audit",
    categoryIcon: ShieldCheck,
    title: "Centralized Log Analysis",
    description: "Correlate logs from multiple sources (SIEM, endpoints, network) to detect complex attack chains.",
    usage: "During incident investigation or weekly threat sweep.",
    tags: ["siem", "correlation", "splunk"],
    prompt: `Correlate log data from [LOG_SOURCES: SIEM|EDR|Firewall|DNS|Proxy] for time range [TIME_RANGE].\n\nCorrelation objectives:\n1. Reconstruct attack kill chain from initial access to objective\n2. Identify timeline of events across disparate log sources\n3. Detect defense evasion techniques (log clearing, process hollowing)\n4. Map adversary behavior to MITRE ATT&CK framework\n5. Identify all affected hosts, users, and data repositories\n6. Determine dwell time and data access scope\n\nOutput a unified incident timeline with evidence citations from each log source and confidence level per detection.`,
  },
  {
    id: "pci-audit",
    category: "compliance",
    categoryIcon: FileCheck,
    title: "PCI-DSS Quarterly Scan",
    description: "Validate PCI-DSS compliance for cardholder data environments including ASV scanning and evidence collection.",
    usage: "Quarterly compliance validation or after infrastructure changes to the CDE.",
    tags: ["pci", "cd", "asv"],
    prompt: `Conduct a PCI-DSS compliance validation for the cardholder data environment (CDE) at [SCOPE].\n\nValidation scope:\n1. Network segmentation verification between CDE and non-CDE\n2. ASV vulnerability scan results review and remediation tracking\n3. Access control review for systems handling cardholder data\n4. Encryption strength verification for stored PAN and transmission\n5. Logging and monitoring coverage for all CDE systems\n6. Physical security controls for data center access\n7. Security policy and procedure documentation review\n\nProvide a control-by-control compliance status with evidence artifacts and remediation deadlines for any gaps.`,
  },
  {
    id: "red-team-scenario",
    category: "incident-response",
    categoryIcon: AlertTriangle,
    title: "Red Team Scenario Design",
    description: "Design a realistic red team exercise scenario tailored to your infrastructure, threat model, and security controls.",
    usage: "Annual red team engagement or new control validation.",
    tags: ["redteam", "adversarial", "emulation"],
    prompt: `Design a red team exercise scenario for [ORG_NAME] based on the following threat profile [THREAT_PROFILE].\n\nScenario requirements:\n1. Initial access vector tailored to external-facing attack surface\n2. Persistence mechanism that evades current detection controls\n3. Lateral movement path through segmented network zones\n4. Privilege escalation chain to domain admin or equivalent\n5. Data exfiltration simulated via approved C2 channel\n6. Defense evasion techniques that test blue team detection capability\n7. Rules of engagement with clear go/no-go criteria\n\nProvide the full operations plan, TTPs mapped to MITRE ATT&CK, and success criteria for each phase.`,
  },
  {
    id: "secops-runbook",
    category: "infrastructure",
    categoryIcon: Server,
    title: "SOC Runbook Creation",
    description: "Create a comprehensive SOC runbook with triage, escalation, and response procedures for common alert types.",
    usage: "New SOC setup or runbook consolidation initiative.",
    tags: ["soc", "runbook", "triage"],
    prompt: `Generate a SOC runbook for alert category [ALERT_CATEGORY: malware|phishing|brute-force|lateral-movement|data-exfil].\n\nRunbook structure:\n1. Alert description and severity classification criteria\n2. Initial triage steps and tools to use\n3. Verification procedures (false-positive elimination checklist)\n4. Escalation criteria and notification tree\n5. Containment procedures by severity level\n6. Eradication and recovery steps\n7. Evidence preservation and case management documentation\n8. Post-incident activities and lessons learned template\n\nWrite at a Tier-1 analyst level with specific commands, queries, and screenshots referenced.`,
  },
  {
    id: "supply-chain",
    category: "compliance",
    categoryIcon: FileCheck,
    title: "Supply Chain Risk Assessment",
    description: "Assess third-party vendor security posture, software supply chain risks, and open-source dependency hygiene.",
    usage: "Vendor onboarding or quarterly supply chain review.",
    tags: ["supply-chain", "vendors", "sbom"],
    prompt: `Conduct a supply chain risk assessment for [VENDOR_NAME or SOFTWARE_LIST].\n\nAssessment scope:\n1. Vendor security certifications and audit history\n2. Data processing and storage locations\n3. Sub-processor relationships and 4th-party risks\n4. Software Bill of Materials (SBOM) analysis for open-source dependencies\n5. Vulnerability disclosure program and patching SLA\n6. Business continuity and disaster recovery plans\n7. Contractual security requirements and right-to-audit clauses\n8. Exit strategy and data migration provisions\n\nScore each vendor against a standardized risk matrix and provide tier-specific recommendations.`,
  },
  {
    id: "ad-forensics",
    category: "security-audit",
    categoryIcon: ShieldCheck,
    title: "Active Directory Forensics",
    description: "Analyze Active Directory for signs of compromise: Golden Ticket, DCSync, Kerberoasting, and ACL abuse.",
    usage: "Post-breach investigation or monthly AD security review.",
    tags: ["active-directory", "kerberos", "domain"],
    prompt: `Perform a forensic analysis of Active Directory domain [DOMAIN_NAME] for signs of compromise.\n\nAnalysis scope:\n1. Kerberoasting indicators: unusual TGS requests for high-privilege accounts\n2. Golden Ticket / Silver Ticket detection via anomalous Kerberos PAC validation\n3. DCSync attack artifacts and replication audit review\n4. ACL abuse: AdminSDHolder, DCSync rights on non-DC accounts\n5. Skeleton key and credential theft artifacts\n6. Delegation abuse: unconstrained and constrained delegation misconfigurations\n7. Trust relationship anomalies and SID history abuse\n8. Group Policy Object (GPO) modifications and persistence\n\nProvide a priority-ranked remediation plan with specific ADSI Edit or PowerShell commands.`,
  },
  {
    id: "kubernetes-incident",
    category: "incident-response",
    categoryIcon: AlertTriangle,
    title: "Kubernetes Incident Response",
    description: "Respond to security incidents in Kubernetes clusters including container breakout, cryptomining, and RBAC abuse.",
    usage: "Cluster security alert or when suspicious workload is detected.",
    tags: ["kubernetes", "containers", "cluster"],
    prompt: `Respond to a security incident in Kubernetes cluster [CLUSTER_NAME] involving [ALERT_TYPE: container-breakout|cryptomining|rbac-abuse|supply-chain].\n\nResponse steps:\n1. Identify compromised pods, nodes, and namespaces\n2. Capture pod logs, container images, and volume mounts as evidence\n3. Isolate affected workloads via network policies and taints\n4. Audit RBAC and service account usage for privilege escalation\n5. Review admission controller logs for mutated workloads\n6. Scan container registry for trojanized images\n7. Rotate cluster tokens, service account secrets, and kubeconfigs\n8. Validate etcd backup integrity and restore if needed\n\nDocument the full incident timeline, IoCs, and cluster-wide remediation actions.`,
  },
  {
    id: "crypto-audit",
    category: "compliance",
    categoryIcon: FileCheck,
    title: "Cryptographic Inventory",
    description: "Inventory and validate all cryptographic assets: certificates, keys, HSMs, and cipher suites across infrastructure.",
    usage: "Pre-certification audit or key rotation cycle.",
    tags: ["crypto", "pki", "tls"],
    prompt: `Inventory all cryptographic assets across [SCOPE: infrastructure|applications|cloud].\n\nInventory scope:\n1. TLS/SSL certificate inventory with expiry dates and issuers\n2. SSH key pairs (host keys, user keys, deploy keys)\n3. GPG and code-signing certificates\n4. HSM and key management service configurations\n5. Cipher suite and protocol version support (TLS 1.2/1.3, mTLS)\n6. Key rotation policies and last rotation dates\n7. Certificate Authority (CA) trust store audit\n8. Deprecated or weak algorithm usage (SHA-1, RC4, 3DES)\n\nFlag all certificates expiring within [N] days and cryptographic assets using deprecated algorithms.`,
  },
  {
    id: "dlp-assessment",
    category: "infrastructure",
    categoryIcon: Server,
    title: "Data Loss Prevention Audit",
    description: "Assess DLP controls across endpoint, network, and cloud channels to prevent sensitive data exfiltration.",
    usage: "Quarterly DLP effectiveness review or after a data breach.",
    tags: ["dlp", "data", "exfiltration"],
    prompt: `Audit Data Loss Prevention controls across [SCOPE: endpoints|network|email|cloud].\n\nAssessment scope:\n1. Endpoint DLP: USB blocking, clipboard controls, print auditing\n2. Network DLP: TLS inspection, data-in-transit pattern matching, egress filtering\n3. Email DLP: outbound attachment scanning, auto-forwarding rules audit\n4. Cloud DLP: CASB integration, unauthorized share detection, OAuth app audit\n5. Classification: sensitivity labels, data classification coverage\n6. Incident response: DLP alert triage process and false-positive rates\n7. Gap analysis: exfiltration vectors not covered by current controls\n\nProvide a risk-prioritized remediation plan with control effectiveness ratings.`,
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
                  Prompt Shabloni
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
          <StatusPill tone="accent">Prompts Library</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Battle-ready prompts{" "}
            <span className="text-muted-foreground">for every operation.</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Pre-approved prompt templates developed by CyberAI operators. Click any card to view the full template — copy and adapt to your environment.
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
                No prompts found. Try a different category or keyword.
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
