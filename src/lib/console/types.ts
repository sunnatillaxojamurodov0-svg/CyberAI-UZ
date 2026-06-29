/* ──────────────────────────────────────────────────────────────
   CyberAI · Virtual Console — Core Types
   A fully sandboxed Kali-style pentesting simulation. No real
   network access exists, so challenges can never touch live hosts.
   ────────────────────────────────────────────────────────────── */

export type CTFLevel = 1 | 2 | 3 | 4;

export type CTFCategory =
  | "web"
  | "network"
  | "crypto"
  | "forensics"
  | "privesc"
  | "recon"
  | "password"
  | "reversing"
  | "stego"
  | "osint";

/** A single open port on a virtual host. */
export interface VPort {
  port: number;
  service: string;
  version?: string;
  state?: "open" | "filtered" | "closed";
  /** Optional banner returned by `nc`/banner grabbing. */
  banner?: string;
}

/** A web route served by a virtual host on an HTTP(S) port. */
export interface WebRoute {
  status: number;
  /** Rendered body returned by curl/wget/browser. */
  body: string;
  headers?: Record<string, string>;
  /** If true, requires the given query/param/cred to reveal real content. */
  protected?: boolean;
}

/** A virtual web application bound to a host. */
export interface WebApp {
  server?: string;
  /** Map of path -> route, e.g. "/", "/admin", "/robots.txt". */
  routes: Record<string, WebRoute>;
  /** Paths discoverable via gobuster/dirb (includes hidden ones). */
  discoverablePaths?: string[];
  /** Subdomains/vhosts discoverable via fuzzing. */
  vhosts?: string[];
}

/** Credentials that exist on a service (used by hydra/ssh/ftp sims). */
export interface VCredential {
  service: "ssh" | "ftp" | "http" | "mysql" | "smb";
  username: string;
  password: string;
}

/** A virtual host inside a CTF scenario. */
export interface VHost {
  ip: string;
  hostname?: string;
  os?: string;
  ports: VPort[];
  web?: WebApp;
  credentials?: VCredential[];
  /** Remote filesystem unlocked after gaining shell access. */
  fs?: Record<string, string>;
  /** Path to a privilege-escalation flag/root file, for privesc CTFs. */
  rootFlagPath?: string;
}

/** The whole virtual environment for one challenge. */
export interface CTFEnv {
  hosts: VHost[];
  /** Files placed on the local Kali box (e.g. provided artifacts). */
  localFiles?: Record<string, string>;
  /** Free-form notes shown in the briefing. */
  network?: string;
}

/** A scoring rubric entry — what an ideal solver does. */
export interface CTFRubric {
  /** Tools the analyst is expected to use, in rough order. */
  expectedTools: string[];
  /** Key conceptual steps the AI conversation should reflect. */
  expectedConcepts: string[];
  /** Maximum minutes for a "fast" solve (efficiency bonus). */
  parMinutes: number;
}

export interface CTFChallenge {
  id: string;
  level: CTFLevel;
  category: CTFCategory;
  title: string;
  /** One-line summary for cards. */
  summary: string;
  /** Full narrative briefing. */
  scenario: string;
  /** Step-by-step solution walkthrough (shown after solve). */
  solution?: string[];
  objectives: string[];
  hints: string[];
  /** Primary target IP (entry point). */
  targetIp: string;
  /** The exact flag string the solver must submit. */
  flag: string;
  /** Human-readable flag format, e.g. "CYBERAI{...}". */
  flagFormat: string;
  /** Base points for solving. */
  points: number;
  rubric: CTFRubric;
  env: CTFEnv;
}

/* ── Runtime / session state ─────────────────────────────────── */

export interface TerminalLine {
  id: string;
  /** "input" = user command echoed, "output" = result, "system" = banner. */
  kind: "input" | "output" | "system" | "error" | "ai-hint";
  text: string;
}

/** Tracks how the operator solved a challenge — feeds the scorer. */
export interface SolveTelemetry {
  challengeId: string;
  startedAt: number;
  /** Distinct base commands executed, e.g. "nmap", "curl". */
  toolsUsed: string[];
  /** Total commands run. */
  commandCount: number;
  /** Number of hints revealed. */
  hintsUsed: number;
  /** Questions/messages sent to VAEL during this challenge. */
  aiMessages: string[];
  /** Whether the flag was correct on submit. */
  solved: boolean;
  /** Submission timestamp. */
  submittedAt?: number;
  /** Number of incorrect flag attempts. */
  wrongAttempts: number;
}

export interface ScoreBreakdown {
  /** 0-100 final percentage. */
  total: number;
  correctness: number;
  methodology: number;
  efficiency: number;
  toolCoverage: number;
  aiCollaboration: number;
  independence: number;
  /** Letter grade derived from total. */
  grade: string;
  /** Narrative summary lines (Uzbek). */
  notes: string[];
}
